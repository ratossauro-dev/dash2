import {
  bigint,
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Bots ────────────────────────────────────────────────────────────────────

export const bots = mysqlTable("bots", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  type: mysqlEnum("type", [
    "payment",
    "media_capture",
    "distributor",
    "cloner",
    "account_creator",
    "social_poster",
    "monitor",
    "vip_filler",
  ]).notNull(),
  status: mysqlEnum("status", ["online", "offline", "error", "idle"]).default("offline").notNull(),
  description: text("description"),
  config: text("config"), // JSON string
  lastHeartbeat: timestamp("lastHeartbeat"),
  lastActivity: text("lastActivity"),
  errorCount: int("errorCount").default(0).notNull(),
  totalOperations: bigint("totalOperations", { mode: "number" }).default(0).notNull(),
  hosting: mysqlEnum("hosting", ["discloud", "vps", "local"]).default("vps").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bot = typeof bots.$inferSelect;
export type InsertBot = typeof bots.$inferInsert;

// ─── Bot Logs ─────────────────────────────────────────────────────────────────

export const botLogs = mysqlTable("bot_logs", {
  id: int("id").autoincrement().primaryKey(),
  botId: int("botId").notNull(),
  level: mysqlEnum("level", ["info", "warn", "error", "debug"]).default("info").notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BotLog = typeof botLogs.$inferSelect;
export type InsertBotLog = typeof botLogs.$inferInsert;

// ─── Media Queue ──────────────────────────────────────────────────────────────

export const mediaQueue = mysqlTable("media_queue", {
  id: int("id").autoincrement().primaryKey(),
  sourceUrl: text("sourceUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  mediaType: mysqlEnum("mediaType", ["video", "image", "gif"]).default("video").notNull(),
  category: varchar("category", { length: 64 }), // #novinha, #milf, etc.
  source: mysqlEnum("source", ["erome", "telegram_clone", "manual"]).default("erome").notNull(),
  sourceBotId: int("sourceBotId"),
  status: mysqlEnum("status", ["pending", "posted", "failed", "skipped"]).default("pending").notNull(),
  targetChannel: varchar("targetChannel", { length: 128 }),
  postedAt: timestamp("postedAt"),
  retryCount: int("retryCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MediaQueue = typeof mediaQueue.$inferSelect;
export type InsertMediaQueue = typeof mediaQueue.$inferInsert;

// ─── Subscribers ─────────────────────────────────────────────────────────────

export const subscribers = mysqlTable("subscribers", {
  id: int("id").autoincrement().primaryKey(),
  telegramId: varchar("telegramId", { length: 64 }).notNull().unique(),
  telegramUsername: varchar("telegramUsername", { length: 128 }),
  name: varchar("name", { length: 256 }),
  plan: mysqlEnum("plan", ["basic", "premium", "vip"]).default("basic").notNull(),
  status: mysqlEnum("status", ["active", "expired", "banned", "pending"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = typeof subscribers.$inferInsert;

// ─── Payments ─────────────────────────────────────────────────────────────────

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  subscriberId: int("subscriberId"),
  telegramId: varchar("telegramId", { length: 64 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("BRL").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "expired", "refunded"]).default("pending").notNull(),
  gateway: varchar("gateway", { length: 64 }).default("syncpay").notNull(),
  txId: varchar("txId", { length: 256 }),
  qrCode: text("qrCode"),
  qrCodeBase64: text("qrCodeBase64"),
  pixKey: text("pixKey"),
  plan: mysqlEnum("plan", ["basic", "premium", "vip"]).default("basic").notNull(),
  expiresAt: timestamp("expiresAt"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ─── Social Accounts ──────────────────────────────────────────────────────────

export const socialAccounts = mysqlTable("social_accounts", {
  id: int("id").autoincrement().primaryKey(),
  platform: mysqlEnum("platform", ["twitter", "instagram"]).notNull(),
  username: varchar("username", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }),
  passwordEnc: text("passwordEnc"), // encrypted
  phone: varchar("phone", { length: 32 }),
  proxyUsed: varchar("proxyUsed", { length: 128 }),
  status: mysqlEnum("status", ["active", "banned", "suspended", "unverified", "error"]).default("unverified").notNull(),
  followersCount: int("followersCount").default(0).notNull(),
  postsCount: int("postsCount").default(0).notNull(),
  lastPostAt: timestamp("lastPostAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = typeof socialAccounts.$inferInsert;

// ─── Bot Prompts ──────────────────────────────────────────────────────────────

export const botPrompts = mysqlTable("bot_prompts", {
  id: int("id").autoincrement().primaryKey(),
  botName: varchar("botName", { length: 128 }).notNull(),
  botType: varchar("botType", { length: 64 }).notNull(),
  description: text("description").notNull(),
  promptText: text("promptText").notNull(),
  dependencies: text("dependencies"), // JSON array of pip packages
  envVars: text("envVars"), // JSON array of required env vars
  hosting: mysqlEnum("hosting", ["discloud", "vps", "local"]).default("vps").notNull(),
  version: varchar("version", { length: 16 }).default("1.0.0").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BotPrompt = typeof botPrompts.$inferSelect;
export type InsertBotPrompt = typeof botPrompts.$inferInsert;

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["bot_down", "payment_received", "error_critical", "new_subscriber", "media_posted", "account_created"]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"), // JSON
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ─── API Tokens ───────────────────────────────────────────────────────────────

export const apiTokens = mysqlTable("api_tokens", {
  id: int("id").autoincrement().primaryKey(),
  botId: int("botId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  isActive: boolean("isActive").default(true).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiToken = typeof apiTokens.$inferSelect;
export type InsertApiToken = typeof apiTokens.$inferInsert;
