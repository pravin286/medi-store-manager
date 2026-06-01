"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// test-db.ts
const db_1 = require("./db");
async function test() {
    try {
        const [rows] = await db_1.db.execute("SELECT 1");
        console.log("✅ DB Connected:", rows);
    }
    catch (err) {
        console.error("❌ DB Error:", err);
    }
}
test();
