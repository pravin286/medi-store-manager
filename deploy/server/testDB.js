// test-db.ts
import { db } from "./db";
async function test() {
    try {
        const [rows] = await db.execute("SELECT 1");
        console.log("✅ DB Connected:", rows);
    }
    catch (err) {
        console.error("❌ DB Error:", err);
    }
}
test();
