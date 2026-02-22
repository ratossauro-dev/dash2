import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { nanoid } from "nanoid";
import {
  getAllBots, getBotById, upsertBot, updateBotStatus, updateBotHeartbeat, incrementBotOperations,
  getBotLogs, insertBotLog,
  getMediaQueue, insertMedia, updateMediaStatus, getMediaStats,
  getAllSubscribers, upsertSubscriber, getSubscriberStats,
  getAllPayments, insertPayment, updatePaymentStatus, getPaymentStats,
  getAllSocialAccounts, insertSocialAccount, updateSocialAccountStatus,
  getAllBotPrompts, getBotPromptById, upsertBotPrompt,
  getAllNotifications, insertNotification, markNotificationRead, markAllNotificationsRead, getUnreadNotificationCount,
  getOverviewStats,
  getApiTokensByBotId, getApiTokenByToken, insertApiToken, revokeApiToken, updateApiTokenLastUsed,
} from "./db";

// ─── Bots Router ──────────────────────────────────────────────────────────────

const botsRouter = router({
  list: protectedProcedure.query(async () => getAllBots()),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => getBotById(input.id)),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      type: z.enum(["payment", "media_capture", "distributor", "cloner", "account_creator", "social_poster", "monitor", "vip_filler"]),
      description: z.string().optional(),
      hosting: z.enum(["discloud", "vps", "local"]).default("vps"),
      config: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await upsertBot({ ...input, status: "offline", errorCount: 0, totalOperations: 0 });
      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["online", "offline", "error", "idle"]),
      lastActivity: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await updateBotStatus(input.id, input.status, input.lastActivity);
      if (input.status === "error" || input.status === "offline") {
        const bot = await getBotById(input.id);
        if (bot) {
          await insertNotification({
            type: "bot_down",
            title: `Bot ${bot.name} está ${input.status === "error" ? "com erro" : "offline"}`,
            message: `O bot "${bot.name}" (${bot.type}) parou de funcionar. Última atividade: ${bot.lastActivity ?? "desconhecida"}`,
          });
          await notifyOwner({
            title: `⚠️ Bot ${bot.name} OFFLINE`,
            content: `O bot "${bot.name}" está ${input.status}. Verifique o dashboard imediatamente.`,
          });
        }
      }
      return { success: true };
    }),

  heartbeat: publicProcedure
    .input(z.object({ id: z.number(), token: z.string() }))
    .mutation(async ({ input }) => {
      await updateBotHeartbeat(input.id);
      await incrementBotOperations(input.id);
      return { success: true };
    }),

  getLogs: protectedProcedure
    .input(z.object({ botId: z.number().optional(), limit: z.number().default(100) }))
    .query(async ({ input }) => getBotLogs(input.botId, input.limit)),

  addLog: publicProcedure
    .input(z.object({
      botId: z.number(),
      level: z.enum(["info", "warn", "error", "debug"]),
      message: z.string(),
      metadata: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await insertBotLog(input);
      if (input.level === "error") {
        const bot = await getBotById(input.botId);
        await insertNotification({
          type: "error_critical",
          title: `Erro crítico no bot ${bot?.name ?? input.botId}`,
          message: input.message,
          metadata: input.metadata,
        });
      }
      return { success: true };
    }),
});

// ─── Media Router ─────────────────────────────────────────────────────────────

const mediaRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.enum(["pending", "posted", "failed", "skipped"]).optional(), limit: z.number().default(50) }))
    .query(async ({ input }) => getMediaQueue(input.status, input.limit)),

  add: publicProcedure
    .input(z.object({
      sourceUrl: z.string().url(),
      thumbnailUrl: z.string().url().optional(),
      mediaType: z.enum(["video", "image", "gif"]).default("video"),
      category: z.string().optional(),
      source: z.enum(["erome", "telegram_clone", "manual"]).default("erome"),
      sourceBotId: z.number().optional(),
      targetChannel: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await insertMedia(input);
      await insertNotification({
        type: "media_posted",
        title: `Nova mídia adicionada à fila`,
        message: `Categoria: ${input.category ?? "sem categoria"} | Fonte: ${input.source}`,
      });
      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["pending", "posted", "failed", "skipped"]) }))
    .mutation(async ({ input }) => {
      await updateMediaStatus(input.id, input.status);
      return { success: true };
    }),

  stats: protectedProcedure.query(async () => getMediaStats()),
});

// ─── Subscribers Router ───────────────────────────────────────────────────────

const subscribersRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(100) }))
    .query(async ({ input }) => getAllSubscribers(input.limit)),

  upsert: protectedProcedure
    .input(z.object({
      telegramId: z.string(),
      telegramUsername: z.string().optional(),
      name: z.string().optional(),
      plan: z.enum(["basic", "premium", "vip"]).default("basic"),
      status: z.enum(["active", "expired", "banned", "pending"]).default("pending"),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      await upsertSubscriber(input);
      await insertNotification({
        type: "new_subscriber",
        title: `Novo assinante: ${input.name ?? input.telegramUsername ?? input.telegramId}`,
        message: `Plano: ${input.plan} | Status: ${input.status}`,
      });
      return { success: true };
    }),

  stats: protectedProcedure.query(async () => getSubscriberStats()),
});

// ─── Payments Router ──────────────────────────────────────────────────────────

const paymentsRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(100) }))
    .query(async ({ input }) => getAllPayments(input.limit)),

  create: protectedProcedure
    .input(z.object({
      subscriberId: z.number().optional(),
      telegramId: z.string().optional(),
      amount: z.string(),
      plan: z.enum(["basic", "premium", "vip"]).default("basic"),
      txId: z.string().optional(),
      qrCode: z.string().optional(),
      qrCodeBase64: z.string().optional(),
      pixKey: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await insertPayment(input);
      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["pending", "paid", "expired", "refunded"]) }))
    .mutation(async ({ input }) => {
      await updatePaymentStatus(input.id, input.status);
      if (input.status === "paid") {
        await insertNotification({
          type: "payment_received",
          title: "Pagamento recebido!",
          message: `Pagamento #${input.id} confirmado via Sync Pay`,
        });
        await notifyOwner({ title: "💰 Pagamento Recebido", content: `Pagamento #${input.id} foi confirmado.` });
      }
      return { success: true };
    }),

  stats: protectedProcedure.query(async () => getPaymentStats()),
});

// ─── Social Accounts Router ───────────────────────────────────────────────────

const socialAccountsRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(100) }))
    .query(async ({ input }) => getAllSocialAccounts(input.limit)),

  add: publicProcedure
    .input(z.object({
      platform: z.enum(["twitter", "instagram"]),
      username: z.string(),
      email: z.string().optional(),
      passwordEnc: z.string().optional(),
      phone: z.string().optional(),
      proxyUsed: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await insertSocialAccount(input);
      await insertNotification({
        type: "account_created",
        title: `Nova conta criada: @${input.username}`,
        message: `Plataforma: ${input.platform}`,
      });
      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["active", "banned", "suspended", "unverified", "error"]) }))
    .mutation(async ({ input }) => {
      await updateSocialAccountStatus(input.id, input.status);
      return { success: true };
    }),
});

// ─── Bot Prompts Router ───────────────────────────────────────────────────────

const promptsRouter = router({
  list: protectedProcedure.query(async () => getAllBotPrompts()),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => getBotPromptById(input.id)),

  upsert: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      botName: z.string(),
      botType: z.string(),
      description: z.string(),
      promptText: z.string(),
      dependencies: z.string().optional(),
      envVars: z.string().optional(),
      hosting: z.enum(["discloud", "vps", "local"]).default("vps"),
      version: z.string().default("1.0.0"),
    }))
    .mutation(async ({ input }) => {
      await upsertBotPrompt(input);
      return { success: true };
    }),
});

// ─── Notifications Router ─────────────────────────────────────────────────────

const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => getAllNotifications(input.limit)),

  unreadCount: protectedProcedure.query(async () => {
    const count = await getUnreadNotificationCount();
    return { count };
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await markNotificationRead(input.id);
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async () => {
    await markAllNotificationsRead();
    return { success: true };
  }),
});

// ─── Stats Router ─────────────────────────────────────────────────────────────

const statsRouter = router({
  overview: protectedProcedure.query(async () => getOverviewStats()),
});

// ─── API Tokens Router ─────────────────────────────────────────────────────

const apiTokensRouter = router({
  listByBot: protectedProcedure
    .input(z.object({ botId: z.number() }))
    .query(async ({ input }) => getApiTokensByBotId(input.botId)),

  generate: protectedProcedure
    .input(z.object({ botId: z.number(), name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const token = `bdt_${nanoid(32)}`;
      const created = await insertApiToken({ botId: input.botId, name: input.name, token });
      return created;
    }),

  revoke: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await revokeApiToken(input.id);
      return { success: true };
    }),
});

// ─── Public Bot API Router (autenticado por Bearer token) ─────────────────────

async function validateBotToken(authHeader: string | undefined): Promise<{ botId: number; tokenId: number } | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const record = await getApiTokenByToken(token);
  if (!record) return null;
  await updateApiTokenLastUsed(record.id);
  return { botId: record.botId, tokenId: record.id };
}

const botApiRouter = router({
  heartbeat: publicProcedure
    .input(z.object({ authorization: z.string(), activity: z.string().optional() }))
    .mutation(async ({ input }) => {
      const auth = await validateBotToken(input.authorization);
      if (!auth) return { success: false, error: "Token inválido" };
      await updateBotHeartbeat(auth.botId);
      await incrementBotOperations(auth.botId);
      if (input.activity) await updateBotStatus(auth.botId, "online", input.activity);
      return { success: true, botId: auth.botId };
    }),

  log: publicProcedure
    .input(z.object({
      authorization: z.string(),
      level: z.enum(["info", "warn", "error", "debug"]),
      message: z.string(),
      metadata: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const auth = await validateBotToken(input.authorization);
      if (!auth) return { success: false, error: "Token inválido" };
      await insertBotLog({ botId: auth.botId, level: input.level, message: input.message, metadata: input.metadata });
      if (input.level === "error") {
        const bot = await getBotById(auth.botId);
        await insertNotification({
          type: "error_critical",
          title: `Erro crítico: ${bot?.name ?? auth.botId}`,
          message: input.message,
        });
      }
      return { success: true };
    }),

  status: publicProcedure
    .input(z.object({
      authorization: z.string(),
      status: z.enum(["online", "offline", "error", "idle"]),
      activity: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const auth = await validateBotToken(input.authorization);
      if (!auth) return { success: false, error: "Token inválido" };
      await updateBotStatus(auth.botId, input.status, input.activity);
      if (input.status === "offline" || input.status === "error") {
        const bot = await getBotById(auth.botId);
        if (bot) {
          await insertNotification({
            type: "bot_down",
            title: `Bot ${bot.name} ${input.status === "error" ? "com erro" : "offline"}`,
            message: `Status reportado pelo próprio bot. Atividade: ${input.activity ?? "desconhecida"}`,
          });
          await notifyOwner({ title: `⚠️ Bot ${bot.name} ${input.status.toUpperCase()}`, content: `O bot "${bot.name}" reportou status ${input.status}.` });
        }
      }
      return { success: true };
    }),

  addMedia: publicProcedure
    .input(z.object({
      authorization: z.string(),
      sourceUrl: z.string().url(),
      thumbnailUrl: z.string().url().optional(),
      mediaType: z.enum(["video", "image", "gif"]).default("video"),
      category: z.string().optional(),
      source: z.enum(["erome", "telegram_clone", "manual"]).default("erome"),
      targetChannel: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const auth = await validateBotToken(input.authorization);
      if (!auth) return { success: false, error: "Token inválido" };
      const { authorization: _, ...mediaData } = input;
      await insertMedia({ ...mediaData, sourceBotId: auth.botId });
      return { success: true };
    }),

  addSubscriber: publicProcedure
    .input(z.object({
      authorization: z.string(),
      telegramId: z.string(),
      telegramUsername: z.string().optional(),
      name: z.string().optional(),
      plan: z.enum(["basic", "premium", "vip"]).default("basic"),
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const auth = await validateBotToken(input.authorization);
      if (!auth) return { success: false, error: "Token inválido" };
      const { authorization: _, expiresAt, ...subData } = input;
      await upsertSubscriber({ ...subData, status: "active", expiresAt: expiresAt ? new Date(expiresAt) : undefined });
      await insertNotification({
        type: "new_subscriber",
        title: `Novo assinante via bot: ${subData.name ?? subData.telegramUsername ?? subData.telegramId}`,
        message: `Plano: ${subData.plan}`,
      });
      return { success: true };
    }),

  addSocialAccount: publicProcedure
    .input(z.object({
      authorization: z.string(),
      platform: z.enum(["twitter", "instagram"]),
      username: z.string(),
      email: z.string().optional(),
      passwordEnc: z.string().optional(),
      phone: z.string().optional(),
      proxyUsed: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const auth = await validateBotToken(input.authorization);
      if (!auth) return { success: false, error: "Token inválido" };
      const { authorization: _, ...accountData } = input;
      await insertSocialAccount(accountData);
      await insertNotification({
        type: "account_created",
        title: `Nova conta criada: @${accountData.username}`,
        message: `Plataforma: ${accountData.platform} | Bot ID: ${auth.botId}`,
      });
      return { success: true };
    }),

  listSocialAccounts: publicProcedure
    .input(z.object({ authorization: z.string() }))
    .query(async ({ input }) => {
      const auth = await validateBotToken(input.authorization);
      if (!auth) throw new TRPCError({ code: "UNAUTHORIZED", message: "Token inválido" });
      const accounts = await getAllSocialAccounts();
      const filtered = accounts.filter(acc => acc.status === "active");
      console.log(`[Bot API] Bot ${auth.botId} requested accounts. Found: ${filtered.length} active.`);
      return filtered;
    }),
});

// ─── LLM Assistant Router ─────────────────────────────────────────────────────

const llmRouter = router({
  chat: protectedProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      })),
    }))
    .mutation(async ({ input }) => {
      const systemPrompt = `Você é o Assistente de Automação do Bot Dashboard, uma IA especializada em criar e otimizar bots para Telegram, X (Twitter) e Instagram.

Você tem conhecimento profundo sobre:
- Criação de bots Telegram com python-telegram-bot e Telethon
- Automação de redes sociais com Selenium e Playwright
- Integração com APIs de pagamento (Sync Pay, PIX)
- Scraping de mídias do Erome sem download local
- Arquitetura de sistemas de bots escaláveis
- Deploy em Discloud e VPS
- Banco de dados MySQL/PostgreSQL para armazenar estados dos bots

Quando o usuário pedir um prompt para criar um bot, forneça um prompt detalhado e completo em português que uma IA possa usar para gerar o código Python funcional. O prompt deve incluir:
1. Descrição completa do bot e suas funcionalidades
2. Dependências necessárias (pip packages)
3. Variáveis de ambiente necessárias
4. Estrutura do código (classes, funções principais)
5. Lógica de heartbeat para o dashboard
6. Tratamento de erros e logging
7. Instruções de deploy (Discloud ou VPS)

Responda sempre em português brasileiro.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          ...input.messages,
        ],
      });

      const content = response.choices?.[0]?.message?.content ?? "Erro ao processar resposta.";
      return { content };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  bots: botsRouter,
  media: mediaRouter,
  subscribers: subscribersRouter,
  payments: paymentsRouter,
  socialAccounts: socialAccountsRouter,
  prompts: promptsRouter,
  notifications: notificationsRouter,
  stats: statsRouter,
  llm: llmRouter,
  apiTokens: apiTokensRouter,
  botApi: botApiRouter,
});

export type AppRouter = typeof appRouter;
