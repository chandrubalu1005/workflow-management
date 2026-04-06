import { Server } from 'socket.io';

let io;
const connectedUsers = new Map(); // userId -> { socketId, name, status }

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "*", 
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('join', (room) => {
            socket.join(room);
        });

        socket.on('user_identify', ({ id, name }) => {
            if (id) {
                connectedUsers.set(id, { socketId: socket.id, name, status: 'active', lastSeen: new Date() });
                socket.userId = id;
                broadcastPresence();
            }
        });

        socket.on('set_status', (status) => {
            if (socket.userId && connectedUsers.has(socket.userId)) {
                const user = connectedUsers.get(socket.userId);
                user.status = status;
                connectedUsers.set(socket.userId, user);
                broadcastPresence();
            }
        });

        socket.on('disconnect', () => {
            if (socket.userId) {
                connectedUsers.delete(socket.userId);
                broadcastPresence();
            }
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

const broadcastPresence = () => {
    const users = Array.from(connectedUsers.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        status: data.status,
        lastSeen: data.lastSeen
    }));
    io.emit('presence_update', users);
};

export const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
