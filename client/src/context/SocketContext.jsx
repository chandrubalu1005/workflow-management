import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { user } = useAuth();
    const API = import.meta.env.VITE_API_URL;

    useEffect(() => {
        if (user) {
            const newSocket = io(API, {
                query: { userId: user.id },
                transports: ['websocket']
            });

            newSocket.on('connect', () => {
                console.log('Socket Connected');
                newSocket.emit('user_identify', { id: user.id, name: user.name });
            });

            newSocket.on('presence_update', (users) => {
                setOnlineUsers(users);
            });

            setSocket(newSocket);

            return () => newSocket.close();
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
