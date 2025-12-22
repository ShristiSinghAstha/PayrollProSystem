import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { message, notification } from 'antd';
import {
    BellOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    FileTextOutlined,
    CalendarOutlined
} from '@ant-design/icons';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated || !user?._id) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setConnected(false);
            }
            return;
        }

        // Initialize socket connection
        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket connected');
            setConnected(true);

            // Join user-specific room
            newSocket.emit('join', user._id);

            // Join admin room if admin
            if (user.role === 'admin') {
                newSocket.emit('join_admin');
            }
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
            setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setConnected(false);
        });

        // Listen for notifications
        newSocket.on('notification', (data) => {
            console.log('Received notification:', data);
            showNotification(data);
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [isAuthenticated, user]);

    const showNotification = (data) => {
        const icons = {
            payslip: <FileTextOutlined style={{ color: '#1890ff' }} />,
            leave: <CalendarOutlined style={{ color: '#52c41a' }} />,
            payroll: <FileTextOutlined style={{ color: '#faad14' }} />,
            success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
            error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
            info: <BellOutlined style={{ color: '#1890ff' }} />
        };

        notification.open({
            message: data.title || 'Notification',
            description: data.message || '',
            icon: icons[data.type] || icons.info,
            placement: 'topRight',
            duration: 6,
        });

        // Also show a brief message
        message.info(data.message || 'New notification', 4);
    };

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};
