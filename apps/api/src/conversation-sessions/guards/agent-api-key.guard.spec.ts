import { UnauthorizedException } from '@nestjs/common';
import { AgentApiKeyGuard } from './agent-api-key.guard';

const ctx = (key?: string) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: key ? { 'x-leca-agent-key': key } : {},
      }),
    }),
  }) as any;

describe('AgentApiKeyGuard', () => {
  const config = { getOrThrow: () => 'secret' } as any;
  const guard = new AgentApiKeyGuard(config);

  it('should allow a request with the correct key', () => {
    expect(guard.canActivate(ctx('secret'))).toBe(true);
  });
  it('should reject a missing key', () => {
    expect(() => guard.canActivate(ctx())).toThrow(UnauthorizedException);
  });
  it('should reject a wrong key', () => {
    expect(() => guard.canActivate(ctx('nope'))).toThrow(UnauthorizedException);
  });
});
