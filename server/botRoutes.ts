import { Router } from "express";
import {
  getApiTokenByToken,
  updateApiTokenLastUsed,
  updateBotHeartbeat,
  updateBotStatus,
  incrementBotOperations,
  insertBotLog,
  getBotById,
  insertNotification,
  insertMedia,
  getMediaQueue,
  updateMediaStatus,
  upsertSubscriber,
  insertSocialAccount,
  getAllSocialAccounts,
} from "./db";
import { notifyOwner } from "./_core/notification";

const botRouter = Router();

// ─── Middleware: parse Bearer token ──────────────────────────────────────────
async function authenticate(req: any, res: any) {
  const authHeader: string =
    req.headers["authorization"] ||
    req.headers["x-bot-token"] ||
    (req.body?.authorization ? `Bearer ${req.body.authorization}` : "");
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    res.status(401).json({ success: false, error: "Token ausente" });
    return null;
  }
  const record = await getApiTokenByToken(token);
  if (!record) {
    res.status(401).json({ success: false, error: "Token inválido" });
    return null;
  }
  await updateApiTokenLastUsed(record.id);
  return { botId: record.botId, tokenId: record.id };
}

// ─── POST /api/bot/heartbeat ─────────────────────────────────────────────────
botRouter.post("/heartbeat", async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;
    await updateBotHeartbeat(auth.botId);
    await incrementBotOperations(auth.botId);
    const activity = req.body?.activity;
    if (activity) await updateBotStatus(auth.botId, "online", activity);
    res.json({ success: true, botId: auth.botId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/bot/log ───────────────────────────────────────────────────────
botRouter.post("/log", async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;
    const { level, message, metadata } = req.body;
    if (!level || !message) {
      res.status(400).json({ success: false, error: "level e message são obrigatórios" });
      return;
    }
    await insertBotLog({ botId: auth.botId, level, message, metadata });
    if (level === "error") {
      const bot = await getBotById(auth.botId);
      await insertNotification({
        type: "error_critical",
        title: `Erro crítico: ${bot?.name ?? String(auth.botId)}`,
        message,
      });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/bot/status ────────────────────────────────────────────────────
botRouter.post("/status", async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;
    const { status, activity } = req.body;
    if (!status) {
      res.status(400).json({ success: false, error: "status é obrigatório" });
      return;
    }
    await updateBotStatus(auth.botId, status, activity);
    if (status === "offline" || status === "error") {
      const bot = await getBotById(auth.botId);
      if (bot) {
        await insertNotification({
          type: "bot_down",
          title: `Bot ${bot.name} ${status === "error" ? "com erro" : "offline"}`,
          message: `Status reportado pelo próprio bot. Atividade: ${activity ?? "desconhecida"}`,
        });
        await notifyOwner({
          title: `⚠️ Bot ${bot.name} ${status.toUpperCase()}`,
          content: `O bot "${bot.name}" reportou status ${status}.`,
        });
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/bot/media ─────────────────────────────────────────────────────
botRouter.post("/media", async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;
    const { sourceUrl, thumbnailUrl, mediaType, category, source, targetChannel } = req.body;
    if (!sourceUrl) {
      res.status(400).json({ success: false, error: "sourceUrl é obrigatório" });
      return;
    }
    await insertMedia({
      sourceUrl,
      thumbnailUrl,
      mediaType: mediaType ?? "video",
      category,
      source: source ?? "erome",
      targetChannel,
      sourceBotId: auth.botId,
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/bot/media-pending ──────────────────────────────────────────────
botRouter.get("/media-pending", async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;
    const { limit } = req.query;
    const pending = await getMediaQueue("pending", limit ? parseInt(limit as string) : 10);
    res.json({ success: true, media: pending });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PATCH /api/bot/media/:id ────────────────────────────────────────────────
botRouter.patch("/media/:id", async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ success: false, error: "status é obrigatório" });
      return;
    }
    await updateMediaStatus(parseInt(id), status);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/bot/subscriber ────────────────────────────────────────────────
botRouter.post("/subscriber", async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;
    const { telegramId, telegramUsername, name, plan, expiresAt } = req.body;
    if (!telegramId) {
      res.status(400).json({ success: false, error: "telegramId é obrigatório" });
      return;
    }
    await upsertSubscriber({
      telegramId,
      telegramUsername,
      name,
      plan: plan ?? "basic",
      status: "active",
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
    await insertNotification({
      type: "new_subscriber",
      title: `Novo assinante: ${name ?? telegramUsername ?? telegramId}`,
      message: `Plano: ${plan ?? "basic"}`,
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/bot/account ───────────────────────────────────────────────────
botRouter.post("/account", async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;
    const { platform, username, email, passwordEnc, phone, proxyUsed } = req.body;
    if (!platform || !username) {
      res.status(400).json({ success: false, error: "platform e username são obrigatórios" });
      return;
    }
    await insertSocialAccount({ platform, username, email, passwordEnc, phone, proxyUsed });
    await insertNotification({
      type: "account_created",
      title: `Nova conta criada: @${username}`,
      message: `Plataforma: ${platform} | Bot ID: ${auth.botId}`,
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/bot/social-accounts ────────────────────────────────────────────
botRouter.get("/social-accounts", async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;
    const accounts = await getAllSocialAccounts();
    const active = accounts.filter((acc: any) => acc.status === "active");
    console.log(`[Bot API REST] Bot ${auth.botId} requested accounts. Found: ${active.length} active.`);
    res.json({ success: true, accounts: active });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/bot/ping ───────────────────────────────────────────────────────
botRouter.get("/ping", (_req, res) => {
  res.json({ success: true, message: "Bot API online", timestamp: new Date().toISOString() });
});

export { botRouter };
