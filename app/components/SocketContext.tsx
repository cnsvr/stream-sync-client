'use client';

import React, { createContext, ReactNode, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = (): SocketContextType => {
    const context = React.useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider : React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = React.useState<Socket>({} as Socket);

    useEffect(() => {
        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000');
        socketInstance.on('connect', () => {
            console.log('Connected to socket server');
        });
        setSocket(socketInstance);
        return () => {
            socketInstance.disconnect();
        }
    }, []);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};