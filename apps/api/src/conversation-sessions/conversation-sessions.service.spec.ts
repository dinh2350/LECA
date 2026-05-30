import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { ConversationSessionsService } from './conversation-sessions.service';
import { LIVEKIT_ROOM_SERVICE } from '../livekit/livekit.module';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';

const mockRoomServiceClient = {
  createRoom: jest.fn(),
  deleteRoom: jest.fn(),
};

const mockPrisma = {
  lecaUser: { findUnique: jest.fn(), create: jest.fn() },
  conversationSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockUsersService = {
  findById: jest.fn(),
};

const mockConfigService = {
  getOrThrow: jest.fn((key: string) => {
    const map: Record<string, string> = {
      'livekit.apiKey': 'devkey',
      'livekit.apiSecret': 'devsecret',
      'livekit.url': 'ws://livekit:7880',
      'livekit.agentUrl': 'http://agent:3001',
    };
    return map[key] ?? '';
  }),
};

global.fetch = jest.fn().mockResolvedValue({ ok: true });

describe('ConversationSessionsService', () => {
  let service: ConversationSessionsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationSessionsService,
        { provide: LIVEKIT_ROOM_SERVICE, useValue: mockRoomServiceClient },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(ConversationSessionsService);
  });

  describe('create()', () => {
    it('should throw NotFoundException when boilerplate user does not exist', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.create(42)).rejects.toThrow(NotFoundException);
    });

    it('should return sessionId, livekitToken, livekitUrl on success', async () => {
      mockUsersService.findById.mockResolvedValue({
        id: 42,
        email: 'a@b.com',
        firstName: 'A',
        lastName: 'B',
      });
      mockPrisma.lecaUser.findUnique.mockResolvedValue({ id: 'leca-uuid-1' });
      mockRoomServiceClient.createRoom.mockResolvedValue({
        name: 'room-uuid-1',
        sid: 'sid-1',
      });
      mockPrisma.conversationSession.create.mockResolvedValue({
        id: 'session-uuid-1',
        livekitRoomId: 'room-uuid-1',
        status: 'active',
      });

      const result = await service.create(42);

      expect(result.sessionId).toBe('session-uuid-1');
      expect(typeof result.livekitToken).toBe('string');
      expect(result.livekitToken.length).toBeGreaterThan(0);
      expect(result.livekitUrl).toBe('ws://livekit:7880');
    });

    it('should auto-create LecaUser bridge record if absent', async () => {
      mockUsersService.findById.mockResolvedValue({
        id: 42,
        email: 'new@user.com',
        firstName: 'N',
        lastName: 'U',
      });
      mockPrisma.lecaUser.findUnique.mockResolvedValue(null);
      mockPrisma.lecaUser.create.mockResolvedValue({ id: 'new-leca-uuid' });
      mockRoomServiceClient.createRoom.mockResolvedValue({
        name: 'room-2',
        sid: 'sid-2',
      });
      mockPrisma.conversationSession.create.mockResolvedValue({
        id: 'session-2',
        livekitRoomId: 'room-2',
        status: 'active',
      });

      await service.create(42);

      expect(mockPrisma.lecaUser.create).toHaveBeenCalledWith({
        data: { email: 'new@user.com', displayName: 'N U' },
      });
    });
  });

  describe('end()', () => {
    it('should throw NotFoundException when session does not exist', async () => {
      mockPrisma.conversationSession.findUnique.mockResolvedValue(null);

      await expect(service.end('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should mark session ended and call deleteRoom', async () => {
      mockPrisma.conversationSession.findUnique.mockResolvedValue({
        id: 'session-1',
        livekitRoomId: 'room-1',
        status: 'active',
        startedAt: new Date(),
      });
      mockPrisma.conversationSession.update.mockResolvedValue({
        id: 'session-1',
        status: 'ended',
      });
      mockRoomServiceClient.deleteRoom.mockResolvedValue(undefined);

      await service.end('session-1');

      expect(mockRoomServiceClient.deleteRoom).toHaveBeenCalledWith('room-1');
      expect(mockPrisma.conversationSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'session-1' },
          data: expect.objectContaining({ status: 'ended' }),
        }),
      );
    });
  });
});
