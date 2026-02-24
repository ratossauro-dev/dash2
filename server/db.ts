import { and, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  ApiToken,
  Bot,
  BotLog,
  BotPrompt,
  InsertApiToken,
  InsertBot,
  InsertBotLog,
  InsertBotPrompt,
  InsertMediaQueue,
  InsertNotification,
  InsertPayment,
  InsertSocialAccount,
  InsertSubscriber,
  InsertUser,
  MediaQueue,
  Notification,
  Payment,
  SocialAccount,
  Subscriber,
  apiTokens,
  botLogs,
  botPrompts,
  bots,
  mediaQueue,
  notifications,
  payments,
  socialAccounts,
  subscribers,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _pool: mysql.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    console.log("[Database] Initializing connection pool...");
    try {
      // For Aiven/PlanetScale/DigitalOcean, we often need SSL and to be lenient with unauthorized certs in some environments
      // or at least handle the connection explicitly.
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        connectionLimit: 10,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        connectTimeout: 20000, // Increased timeout
        waitForConnections: true,
        queueLimit: 0,
        ssl: {
          rejectUnauthorized: false // Often needed for Aiven/Render connection if CA is not provided
        }
      });

      console.log("[Database] Pool created. Testing connection...");

      // Test the connection immediately
      const connection = await _pool.getConnection();
      console.log("[Database] Successfully connected to the server");
      connection.release();

      _db = drizzle(_pool);
      console.log("[Database] Drizzle instance ready");
    } catch (error: any) {
      console.error("[Database] CRITICAL CONNECTION ERROR:", {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        stack: error.stack
      });
      _db = null;
    }
  } else if (!_db) {
    console.warn("[Database] Cannot initialize: DATABASE_URL is missing");
  }
  return _db;
}


// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Bots ─────────────────────────────────────────────────────────────────────

export async function getAllBots(): Promise<Bot[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bots).orderBy(desc(bots.updatedAt));
}

export async function getBotById(id: number): Promise<Bot | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bots).where(eq(bots.id, id)).limit(1);
  return result[0];
}

export async function upsertBot(data: InsertBot): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(bots).values(data).onDuplicateKeyUpdate({ set: { ...data } });
}

export async function updateBotStatus(id: number, status: Bot["status"], lastActivity?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const updateData: Partial<Bot> = { status };
  if (lastActivity) updateData.lastActivity = lastActivity;
  if (status === "online") updateData.lastHeartbeat = new Date();
  await db.update(bots).set(updateData).where(eq(bots.id, id));
}

export async function updateBotHeartbeat(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(bots).set({ lastHeartbeat: new Date(), status: "online" }).where(eq(bots.id, id));
}

export async function incrementBotOperations(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(bots).set({ totalOperations: sql`${bots.totalOperations} + 1` }).where(eq(bots.id, id));
}

// ─── Bot Logs ─────────────────────────────────────────────────────────────────

export async function getBotLogs(botId?: number, limit = 100): Promise<BotLog[]> {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(botLogs).orderBy(desc(botLogs.createdAt)).limit(limit);
  if (botId) return db.select().from(botLogs).where(eq(botLogs.botId, botId)).orderBy(desc(botLogs.createdAt)).limit(limit);
  return query;
}

export async function insertBotLog(data: InsertBotLog): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(botLogs).values(data);
}

// ─── Media Queue ──────────────────────────────────────────────────────────────

export async function getMediaQueue(status?: MediaQueue["status"], limit = 50): Promise<MediaQueue[]> {
  const db = await getDb();
  if (!db) return [];
  if (status) return db.select().from(mediaQueue).where(eq(mediaQueue.status, status)).orderBy(desc(mediaQueue.createdAt)).limit(limit);
  return db.select().from(mediaQueue).orderBy(desc(mediaQueue.createdAt)).limit(limit);
}

export async function insertMedia(data: InsertMediaQueue): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(mediaQueue).values(data);
}

export async function updateMediaStatus(id: number, status: MediaQueue["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const updateData: Partial<MediaQueue> = { status };
  if (status === "posted") updateData.postedAt = new Date();
  await db.update(mediaQueue).set(updateData).where(eq(mediaQueue.id, id));
}

export async function getMediaStats() {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, posted: 0, failed: 0 };
  const [total, pending, posted, failed] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(mediaQueue),
    db.select({ count: sql<number>`count(*)` }).from(mediaQueue).where(eq(mediaQueue.status, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(mediaQueue).where(eq(mediaQueue.status, "posted")),
    db.select({ count: sql<number>`count(*)` }).from(mediaQueue).where(eq(mediaQueue.status, "failed")),
  ]);
  return { total: total[0]?.count ?? 0, pending: pending[0]?.count ?? 0, posted: posted[0]?.count ?? 0, failed: failed[0]?.count ?? 0 };
}

// ─── Subscribers ─────────────────────────────────────────────────────────────

export async function getAllSubscribers(limit = 100): Promise<Subscriber[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscribers).orderBy(desc(subscribers.createdAt)).limit(limit);
}

export async function upsertSubscriber(data: InsertSubscriber): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(subscribers).values(data).onDuplicateKeyUpdate({ set: { ...data } });
}

export async function getSubscriberStats() {
  const db = await getDb();
  if (!db) return { total: 0, active: 0, expired: 0, vip: 0 };
  const [total, active, expired, vip] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(subscribers),
    db.select({ count: sql<number>`count(*)` }).from(subscribers).where(eq(subscribers.status, "active")),
    db.select({ count: sql<number>`count(*)` }).from(subscribers).where(eq(subscribers.status, "expired")),
    db.select({ count: sql<number>`count(*)` }).from(subscribers).where(eq(subscribers.plan, "vip")),
  ]);
  return { total: total[0]?.count ?? 0, active: active[0]?.count ?? 0, expired: expired[0]?.count ?? 0, vip: vip[0]?.count ?? 0 };
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function getAllPayments(limit = 100): Promise<Payment[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).orderBy(desc(payments.createdAt)).limit(limit);
}

export async function insertPayment(data: InsertPayment): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(payments).values(data);
}

export async function updatePaymentStatus(id: number, status: Payment["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const updateData: Partial<Payment> = { status };
  if (status === "paid") updateData.paidAt = new Date();
  await db.update(payments).set(updateData).where(eq(payments.id, id));
}

export async function getPaymentStats() {
  const db = await getDb();
  if (!db) return { total: 0, paid: 0, pending: 0, revenue: 0 };
  const [total, paid, pending, revenue] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(payments),
    db.select({ count: sql<number>`count(*)` }).from(payments).where(eq(payments.status, "paid")),
    db.select({ count: sql<number>`count(*)` }).from(payments).where(eq(payments.status, "pending")),
    db.select({ sum: sql<number>`COALESCE(SUM(amount), 0)` }).from(payments).where(eq(payments.status, "paid")),
  ]);
  return { total: total[0]?.count ?? 0, paid: paid[0]?.count ?? 0, pending: pending[0]?.count ?? 0, revenue: Number(revenue[0]?.sum ?? 0) };
}

// ─── Social Accounts ──────────────────────────────────────────────────────────

export async function getAllSocialAccounts(limit = 100): Promise<SocialAccount[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(socialAccounts).orderBy(desc(socialAccounts.createdAt)).limit(limit);
}

export async function insertSocialAccount(data: InsertSocialAccount): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(socialAccounts).values(data);
}

export async function updateSocialAccountStatus(id: number, status: SocialAccount["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(socialAccounts).set({ status }).where(eq(socialAccounts.id, id));
}

// ─── Bot Prompts ──────────────────────────────────────────────────────────────

export async function getAllBotPrompts(): Promise<BotPrompt[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(botPrompts).orderBy(desc(botPrompts.updatedAt));
}

export async function getBotPromptById(id: number): Promise<BotPrompt | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(botPrompts).where(eq(botPrompts.id, id)).limit(1);
  return result[0];
}

export async function upsertBotPrompt(data: InsertBotPrompt): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(botPrompts).values(data).onDuplicateKeyUpdate({ set: { ...data } });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getAllNotifications(limit = 50): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function insertNotification(data: InsertNotification): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function markNotificationRead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.isRead, false));
}

export async function getUnreadNotificationCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(eq(notifications.isRead, false));
  return result[0]?.count ?? 0;
}

// ─── API Tokens ───────────────────────────────────────────────────────────────

export async function getApiTokensByBotId(botId: number): Promise<ApiToken[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(apiTokens).where(eq(apiTokens.botId, botId)).orderBy(desc(apiTokens.createdAt));
}

export async function getApiTokenByToken(token: string): Promise<ApiToken | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(apiTokens).where(and(eq(apiTokens.token, token), eq(apiTokens.isActive, true))).limit(1);
  return result[0];
}

export async function insertApiToken(data: InsertApiToken): Promise<ApiToken> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(apiTokens).values(data);
  const result = await db.select().from(apiTokens).where(eq(apiTokens.token, data.token)).limit(1);
  return result[0]!;
}

export async function revokeApiToken(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(apiTokens).set({ isActive: false }).where(eq(apiTokens.id, id));
}

export async function updateApiTokenLastUsed(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(apiTokens).set({ lastUsedAt: new Date() }).where(eq(apiTokens.id, id));
}

// ─── Stats Overview ───────────────────────────────────────────────────────────

export async function getOverviewStats() {
  const db = await getDb();
  if (!db) return { botsOnline: 0, botsTotal: 0, mediaPosted24h: 0, activeSubscribers: 0, revenue30d: 0, socialAccounts: 0 };
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [botsOnline, botsTotal, mediaPosted24h, activeSubscribers, revenue30d, socialAccountsCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(bots).where(eq(bots.status, "online")),
    db.select({ count: sql<number>`count(*)` }).from(bots),
    db.select({ count: sql<number>`count(*)` }).from(mediaQueue).where(and(eq(mediaQueue.status, "posted"), gte(mediaQueue.postedAt, yesterday))),
    db.select({ count: sql<number>`count(*)` }).from(subscribers).where(eq(subscribers.status, "active")),
    db.select({ sum: sql<number>`COALESCE(SUM(amount), 0)` }).from(payments).where(and(eq(payments.status, "paid"), gte(payments.paidAt, thirtyDaysAgo))),
    db.select({ count: sql<number>`count(*)` }).from(socialAccounts).where(eq(socialAccounts.status, "active")),
  ]);
  return {
    botsOnline: botsOnline[0]?.count ?? 0,
    botsTotal: botsTotal[0]?.count ?? 0,
    mediaPosted24h: mediaPosted24h[0]?.count ?? 0,
    activeSubscribers: activeSubscribers[0]?.count ?? 0,
    revenue30d: Number(revenue30d[0]?.sum ?? 0),
    socialAccounts: socialAccountsCount[0]?.count ?? 0,
  };
}
