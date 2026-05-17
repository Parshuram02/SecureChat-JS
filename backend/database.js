const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let db;

async function initDB() {
    db = await open({
        filename: path.join(__dirname, 'vault.db'),
        driver: sqlite3.Database
    });

    // Audit Logs Table - CRITICAL for BTSA Compliance
    await db.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id TEXT,
            category TEXT,
            event_type TEXT,
            user_name TEXT,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Sessions Table - Track Room Activity
    await db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id TEXT,
            case_id TEXT,
            status TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('[DB] Vault Persistence Engine Initialized (SQLite3)');
}

async function logAuditEvent(caseId, category, eventType, userName, details) {
    if (!db) return;
    await db.run(
        `INSERT INTO audit_logs (case_id, category, event_type, user_name, details) VALUES (?, ?, ?, ?, ?)`,
        [caseId, category, eventType, userName, details]
    );
}

async function getAuditLogs(limit = 50) {
    if (!db) return [];
    return await db.all(`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?`, [limit]);
}

async function getDatabaseStats() {
    if (!db) return { logCount: 0, dbSize: '0 KB' };
    const result = await db.get('SELECT COUNT(*) as count FROM audit_logs');
    return {
        logCount: result.count,
        dbType: 'SQLite3 / Relational'
    };
}

module.exports = { initDB, logAuditEvent, getAuditLogs, getDatabaseStats };
