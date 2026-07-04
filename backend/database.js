const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let db;

async function initDB() {
    db = await open({
        filename: path.join(__dirname, 'vault.db'),
        driver: sqlite3.Database
    });

    // Basic Audit Logs
    await db.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id TEXT,
            user_name TEXT,
            purpose TEXT,
            event_type TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('[DB] SQLite Database Initialized');
}

async function logAuditEvent(roomId, userName, purpose, eventType) {
    if (!db) return;
    await db.run(
        `INSERT INTO audit_logs (room_id, user_name, purpose, event_type) VALUES (?, ?, ?, ?)`,
        [roomId, userName, purpose, eventType]
    );
}

module.exports = {
    initDB,
    logAuditEvent
};
