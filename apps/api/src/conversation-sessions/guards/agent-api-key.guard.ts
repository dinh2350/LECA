import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { timingSafeEqual } from 'crypto';
import { AllConfigType } from '../../config/config.type';

@Injectable()
export class AgentApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService<AllConfigType>) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.headers['x-leca-agent-key'];
    const expected = this.config.getOrThrow('agent.apiKey', {
      infer: true,
    });
    if (typeof provided !== 'string')
      throw new UnauthorizedException('Missing agent key');
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid agent key');
    }
    return true;
  }
}
