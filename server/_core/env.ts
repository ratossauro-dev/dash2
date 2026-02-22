export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  dashboardPassword: process.env.DASHBOARD_PASSWORD ?? "admin",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "admin",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

console.log(`[Env] Password configured: ${ENV.dashboardPassword === "admin" ? "DEFAULT (admin)" : "CUSTOM"}`);
