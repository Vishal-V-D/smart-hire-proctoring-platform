// src/api/socketService.ts
import { io, Socket } from 'socket.io-client';

// Define the socket URL - standardizing on port 4000 as per user request
// In production this should come from env variables
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://smart-hire-backend-t0ik.onrender.com';

class SocketService {
    private socket: Socket | null = null;

    public connect(): Socket {
        if (!this.socket) {
            console.log('🔌 Connecting to socket server at:', SOCKET_URL);
            this.socket = io(SOCKET_URL, {
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            this.socket.on('connect', () => {
                console.log('✅ Socket connected:', this.socket?.id);
            });

            this.socket.on('disconnect', () => {
                console.log('❌ Socket disconnected');
            });

            this.socket.on('connect_error', (err) => {
                console.error('⚠️ Socket connection error:', err);
            });
        }
        return this.socket;
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    public getSocket(): Socket | null {
        return this.socket;
    }

    // Role-based room joining
    public joinOrganizerRoom(): void {
        this.socket?.emit('join_organizer_room');
        console.log('📢 Joined organizer room');
    }

    public leaveOrganizerRoom(): void {
        this.socket?.emit('leave_organizer_room');
    }

    public joinCompanyRoom(companyId: string): void {
        if (!companyId) return;
        this.socket?.emit('join_company_room', companyId);
        console.log(`🏢 Joined company room: ${companyId}`);
    }

    public leaveCompanyRoom(companyId: string): void {
        if (!companyId) return;
        this.socket?.emit('leave_company_room', companyId);
    }
}

export const socketService = new SocketService();
