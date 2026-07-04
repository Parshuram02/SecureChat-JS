const http = require('http');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const { initDB, logAuditEvent } = require('./database');

const WS_PORT = 8080;

const httpServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('SecureChat Backend Running');
});

const wss = new WebSocketServer({ server: httpServer });

// Room state: roomId -> { clients: Set, adminId: string, maxCapacity: number }
let rooms = new Map();

async function startServer() {
    await initDB();
    httpServer.listen(WS_PORT, () => {
        console.log(`[WS] Server listening on port ${WS_PORT}`);
    });
}

startServer();

wss.on('connection', (socket) => {
    socket.on('message', async (data) => {
        try {
            const parsedData = JSON.parse(data);
            const { type, payload } = parsedData;

            switch (type) {
                case 'join':
                    await handleJoin(socket, payload);
                    break;
                case 'chat':
                    handleChat(socket, payload);
                    break;
                case 'set-capacity':
                    handleSetCapacity(socket, payload);
                    break;
                case 'request-stats':
                    sendStats(socket);
                    break;
            }
        } catch (err) {
            console.error('[ERR] Failed to process message:', err);
        }
    });

    socket.on('close', () => handleDisconnect(socket));
});

async function handleJoin(socket, payload) {
    const { roomId, name, purpose } = payload;
    socket.userId = uuidv4();
    socket.userName = name;
    socket.roomId = roomId;
    socket.purpose = purpose;

    let room = rooms.get(roomId);

    if (!room) {
        // First user creates the room and becomes Admin
        room = {
            clients: new Set(),
            adminId: socket.userId,
            maxCapacity: 10 // default
        };
        rooms.set(roomId, room);
    } else {
        // Room exists, check capacity
        if (room.clients.size >= room.maxCapacity) {
            socket.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Room is full. Admin limit reached.' }
            }));
            socket.close();
            return;
        }
    }

    room.clients.add(socket);
    const isAdmin = room.adminId === socket.userId;

    socket.send(JSON.stringify({
        type: 'join-success',
        payload: { userId: socket.userId, isAdmin, maxCapacity: room.maxCapacity }
    }));

    await logAuditEvent(roomId, name, purpose, 'JOIN');

    broadcastToRoom(roomId, {
        type: 'system',
        payload: { message: `${name} joined the chat.`, timestamp: new Date().toISOString() }
    });

    broadcastStats(roomId);
}

function handleChat(socket, payload) {
    const { message, roomId } = payload;
    broadcastToRoom(roomId, {
        type: 'chat',
        payload: {
            message,
            senderName: socket.userName,
            senderId: socket.userId,
            timestamp: new Date().toISOString()
        }
    });
}

function handleSetCapacity(socket, payload) {
    const { roomId, capacity } = payload;
    const room = rooms.get(roomId);

    if (room && room.adminId === socket.userId) {
        room.maxCapacity = parseInt(capacity, 10);
        broadcastStats(roomId);
    }
}

function sendStats(socket) {
    if (socket.roomId) {
        const room = rooms.get(socket.roomId);
        if (room) {
            socket.send(JSON.stringify({
                type: 'stats-update',
                payload: {
                    onlineUsers: room.clients.size,
                    maxCapacity: room.maxCapacity
                }
            }));
        }
    }
}

function broadcastStats(roomId) {
    const room = rooms.get(roomId);
    if (room) {
        const stats = {
            onlineUsers: room.clients.size,
            maxCapacity: room.maxCapacity
        };
        broadcastToRoom(roomId, {
            type: 'stats-update',
            payload: stats
        });
    }
}

async function handleDisconnect(socket) {
    if (socket.roomId && rooms.has(socket.roomId)) {
        const room = rooms.get(socket.roomId);
        room.clients.delete(socket);

        await logAuditEvent(socket.roomId, socket.userName, socket.purpose, 'LEAVE');

        if (room.clients.size === 0) {
            rooms.delete(socket.roomId);
        } else {
            // If admin leaves, assign new admin (oldest connected)
            if (room.adminId === socket.userId) {
                const newAdmin = Array.from(room.clients)[0];
                if (newAdmin) {
                    room.adminId = newAdmin.userId;
                    newAdmin.send(JSON.stringify({ type: 'admin-promoted' }));
                }
            }

            broadcastToRoom(socket.roomId, {
                type: 'system',
                payload: { message: `${socket.userName} left the chat.`, timestamp: new Date().toISOString() }
            });
            broadcastStats(socket.roomId);
        }
    }
}

function broadcastToRoom(roomId, data) {
    const room = rooms.get(roomId);
    if (room) {
        const payloadStr = JSON.stringify(data);
        room.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(payloadStr);
            }
        });
    }
}
