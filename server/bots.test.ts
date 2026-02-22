import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createGuestContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.role).toBe("admin");
  });
});

describe("bots.list", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    await expect(caller.bots.list()).rejects.toThrow();
  });

  it("returns array for authenticated user", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.bots.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("bots.create", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    await expect(
      caller.bots.create({ name: "Test Bot", type: "payment", hosting: "discloud" })
    ).rejects.toThrow();
  });

  it("creates a bot with valid data", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.bots.create({
      name: "Test Bot TS",
      type: "payment",
      hosting: "discloud",
      description: "Test bot for vitest",
    });
    expect(result).toEqual({ success: true });
  });
});

describe("media.stats", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    await expect(caller.media.stats()).rejects.toThrow();
  });

  it("returns stats object with numeric fields", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const stats = await caller.media.stats();
    expect(typeof stats.total).toBe("number");
    expect(typeof stats.pending).toBe("number");
    expect(typeof stats.posted).toBe("number");
    expect(typeof stats.failed).toBe("number");
  });
});

describe("subscribers.stats", () => {
  it("returns stats object", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const stats = await caller.subscribers.stats();
    expect(typeof stats.total).toBe("number");
    expect(typeof stats.active).toBe("number");
    expect(typeof stats.vip).toBe("number");
  });
});

describe("payments.stats", () => {
  it("returns stats object with revenue", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const stats = await caller.payments.stats();
    expect(typeof stats.total).toBe("number");
    expect(typeof stats.revenue).toBe("number");
  });
});

describe("notifications.list", () => {
  it("returns array of notifications", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.notifications.list({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("prompts.list", () => {
  it("returns array of prompts", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.prompts.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("socialAccounts.list", () => {
  it("returns array of social accounts", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.socialAccounts.list({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });
});
