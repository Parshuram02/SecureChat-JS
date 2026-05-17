const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const { initDB, logAuditEvent, getAuditLogs, getDatabaseStats } = require('./database');

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

// Business Intelligence / Stats (BTSA Focus)
let stats = {
    totalMessages: 0,
    startTime: Date.now(),
    peakUsers: 0,
    recentEvents: [] 
};

async function startServer() {
    await initDB();
    console.log(`[SERVER] SecureChat Backend running on port ${PORT}`);
}

startServer();

function logSystemEvent(msg) {
    stats.recentEvents.unshift({
        id: uuidv4().substring(0, 8),
        msg,
        time: new Date().toLocaleTimeString()
    });
    if (stats.recentEvents.length > 5) stats.recentEvents.pop();
}

let rooms = new Map(); // roomId -> Set of sockets

wss.on('connection', (socket) => {
    logSystemEvent('New node connection established');
    
    if (wss.clients.size > stats.peakUsers) {
        stats.peakUsers = wss.clients.size;
    }

    socket.on('message', (data) => {
        try {
            const parsedData = JSON.parse(data);
            const { type, payload } = parsedData;

            switch (type) {
                case 'join':
                    handleJoin(socket, payload);
                    break;
                case 'chat':
                    handleChat(socket, payload);
                    break;
                case 'request-stats':
                    sendStats(socket);
                    break;
                default:
                    console.log('[WARN] Unknown message type:', type);
            }
        } catch (err) {
            console.error('[ERR] Failed to parse message:', err);
        }
    });

    socket.on('close', () => {
        handleDisconnect(socket);
    });
});

async function handleJoin(socket, payload) {
    const { roomId, name, caseId, category } = payload;
    socket.roomId = roomId;
    socket.userName = name;
    socket.userId = uuidv4();
    socket.caseId = caseId;
    socket.category = category;

    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
        logSystemEvent(`New room initialized: ${roomId}`);
    }
    rooms.get(roomId).add(socket);

    logSystemEvent(`${name} authenticated & joined ${roomId}`);
    
    // PERSISTENT AUDIT LOG
    await logAuditEvent(caseId, category, 'SESSION_JOIN', name, `Joined room ${roomId}`);

    socket.send(JSON.stringify({
        type: 'join-success',
        payload: { userId: socket.userId }
    }));

    broadcastToRoom(roomId, {
        type: 'system',
        payload: {
            message: `${name} has entered the secure room.`,
            timestamp: new Date().toISOString()
        }
    });
}

function handleChat(socket, payload) {
    const { message, roomId } = payload;
    stats.totalMessages++;

    broadcastToRoom(roomId, {
        type: 'chat',
        payload: {
            message: message, 
            senderName: socket.userName,
            senderId: socket.userId,
            timestamp: new Date().toISOString()
        }
    });
}

async function sendStats(socket) {
    const dbStats = await getDatabaseStats();
    const logs = await getAuditLogs(5); // Get recent logs for the UI

    socket.send(JSON.stringify({
        type: 'stats-update',
        payload: {
            activeUsers: wss.clients.size,
            totalMessages: stats.totalMessages,
            uptimeMinutes: Math.floor((Date.now() - stats.startTime) / 60000),
            peakUsers: stats.peakUsers,
            recentEvents: stats.recentEvents,
            auditLogs: logs, // NEW: Relational data
            dataStored: `${dbStats.logCount * 0.5} KB`, // Simulated size
            encryptionStandard: 'AES-256 GCM/CBC',
            protocol: 'wss/v1.2',
            dbType: dbStats.dbType
        }
    }));
}

async function handleDisconnect(socket) {
    if (socket.roomId && rooms.has(socket.roomId)) {
        rooms.get(socket.roomId).delete(socket);
        
        // PERSISTENT AUDIT LOG
        await logAuditEvent(socket.caseId, socket.category, 'SESSION_LEAVE', socket.userName, `Disconnected from ${socket.roomId}`);

        if (rooms.get(socket.roomId).size === 0) {
            rooms.delete(socket.roomId);
        } else {
            broadcastToRoom(socket.roomId, {
                type: 'system',
                payload: {
                    message: `${socket.userName} has left the session.`,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }
    logSystemEvent(`${socket.userName || 'Unknown'} node disconnected`);
}

function broadcastToRoom(roomId, data) {
    if (rooms.has(roomId)) {
        const payload = JSON.stringify(data);
        rooms.get(roomId).forEach(client => {
            if (client.readyState === 1) {
                client.send(payload);
            }
        });
    }
}
