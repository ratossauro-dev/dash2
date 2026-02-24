
import { drizzle } from "drizzle-orm/mysql2";
import { notifications } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";

async function test() {
    const db = drizzle({} as any);
    const query = db.select().from(notifications).where(eq(notifications.isRead, false)).toSQL();
    console.log("GENERATED SQL:", query.sql);
}

test().catch(console.error);
