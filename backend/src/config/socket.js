import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`✅ Socket connected: ${socket.id}`);

        // Join user-specific room
        socket.on('join', (userId) => {
            socket.join(`user_${userId}`);
            console.log(`User ${userId} joined their room`);
        });

        // Join admin room
        socket.on('join_admin', () => {
            socket.join('admin_room');
            console.log('Admin joined admin room');
        });

        socket.on('disconnect', () => {
            console.log(`❌ Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

// Emit notification to specific user
export const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(`user_${userId}`).emit(event, data);
    }
};

// Emit notification to all admins
export const emitToAdmins = (event, data) => {
    if (io) {
        io.to('admin_room').emit(event, data);
    }
};

// Emit to everyone
export const emitToAll = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};
