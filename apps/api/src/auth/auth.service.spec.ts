import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SessionService } from '../session/session.service';
import { MailService } from '../mail/mail.service';
import { AuthProvidersEnum } from './auth-providers.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { RoleEnum } from '../roles/roles.enum';
import { User } from '../users/domain/user';
import { Session } from '../session/domain/session';

jest.mock('bcryptjs');

const CONFIG: Record<string, string> = {
  'auth.secret': 'test-secret',
  'auth.expires': '1d',
  'auth.refreshSecret': 'test-refresh-secret',
  'auth.refreshExpires': '7d',
  'auth.confirmEmailSecret': 'test-confirm-secret',
  'auth.confirmEmailExpires': '1d',
  'auth.forgotSecret': 'test-forgot-secret',
  'auth.forgotExpires': '1d',
};

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'user@example.com',
    password: 'hashed',
    provider: AuthProvidersEnum.email,
    socialId: null,
    firstName: 'John',
    lastName: 'Doe',
    photo: null,
    role: { id: RoleEnum.user },
    status: { id: StatusEnum.active },
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: new Date(),
    ...overrides,
  } as User;
}

function makeSession(user: User): Session {
  return {
    id: 1,
    userId: Number(user.id),
    hash: 'session-hash',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: new Date(),
  };
}

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, keyof UsersService>>;
  let sessionService: jest.Mocked<Pick<SessionService, keyof SessionService>>;
  let mailService: jest.Mocked<Pick<MailService, keyof MailService>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByIds: jest.fn(),
            findByEmail: jest.fn(),
            findBySocialIdAndProvider: jest.fn(),
            findManyWithPagination: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: SessionService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            updateByHash: jest.fn(),
            deleteById: jest.fn(),
            deleteByUserId: jest.fn(),
            deleteByUserIdWithExclude: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            userSignUp: jest.fn(),
            forgotPassword: jest.fn(),
            confirmNewEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: new JwtService({ secret: 'test' }),
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (!(key in CONFIG))
                throw new Error(`Config key missing: ${key}`);
              return CONFIG[key];
            }),
            get: jest.fn((key: string) => CONFIG[key]),
          },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    usersService = module.get(UsersService);
    sessionService = module.get(SessionService);
    mailService = module.get(MailService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('validateLogin', () => {
    it('should throw when email is not found', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.validateLogin({
          email: 'nobody@example.com',
          password: 'pw',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw when user registered via social provider', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(
        makeUser({ provider: 'google' }),
      );

      await expect(
        authService.validateLogin({
          email: 'user@example.com',
          password: 'pw',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw when password is wrong', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(makeUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.validateLogin({
          email: 'user@example.com',
          password: 'wrong',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should return tokens and user when credentials are valid', async () => {
      const user = makeUser();
      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (sessionService.create as jest.Mock).mockResolvedValue(makeSession(user));

      const result = await authService.validateLogin({
        email: 'user@example.com',
        password: 'secret',
      });

      expect(result.token).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.user).toBe(user);
    });
  });

  describe('register', () => {
    it('should create an inactive user and sends a signup email', async () => {
      const user = makeUser({ status: { id: StatusEnum.inactive } });
      (usersService.create as jest.Mock).mockResolvedValue(user);

      await authService.register({
        email: 'new@example.com',
        password: 'secret123',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          status: { id: StatusEnum.inactive },
          role: { id: RoleEnum.user },
        }),
      );
      expect(mailService.userSignUp).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'new@example.com' }),
      );
    });
  });

  describe('forgotPassword', () => {
    it('should throw when email does not exist', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.forgotPassword('nobody@example.com'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should send a reset email when user exists', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(makeUser());

      await authService.forgotPassword('user@example.com');

      expect(mailService.forgotPassword).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'user@example.com' }),
      );
    });
  });

  describe('confirmEmail', () => {
    it('should throw for an invalid hash', async () => {
      await expect(authService.confirmEmail('bad-hash')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('validateSocialLogin', () => {
    it('should create a new user when none exists for the social id', async () => {
      const newUser = makeUser({ provider: 'google', socialId: 'google-123' });
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (usersService.findBySocialIdAndProvider as jest.Mock).mockResolvedValue(
        null,
      );
      (usersService.create as jest.Mock).mockResolvedValue(newUser);
      (usersService.findById as jest.Mock).mockResolvedValue(newUser);
      (sessionService.create as jest.Mock).mockResolvedValue(
        makeSession(newUser),
      );

      const result = await authService.validateSocialLogin('google', {
        id: 'google-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'google', socialId: 'google-123' }),
      );
      expect(result.user).toBe(newUser);
    });

    it('should return existing user when social id already linked', async () => {
      const user = makeUser({ provider: 'google', socialId: 'google-123' });
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (usersService.findBySocialIdAndProvider as jest.Mock).mockResolvedValue(
        user,
      );
      (usersService.update as jest.Mock).mockResolvedValue(user);
      (sessionService.create as jest.Mock).mockResolvedValue(makeSession(user));

      const result = await authService.validateSocialLogin('google', {
        id: 'google-123',
        email: 'user@example.com',
      });

      expect(usersService.create).not.toHaveBeenCalled();
      expect(result.user).toBe(user);
    });
  });

  describe('logout', () => {
    it('should delete the session by id', async () => {
      await authService.logout({ sessionId: 1 });
      expect(sessionService.deleteById).toHaveBeenCalledWith(1);
    });
  });
});
