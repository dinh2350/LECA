import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import { JwtPayloadType } from './types/jwt-payload.type';

@Injectable()
export class OptionalJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-optional',
) {
  constructor(configService: ConfigService<AllConfigType>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow('auth.secret', { infer: true }),
      ignoreExpiration: false,
    });
  }

  // Returns null instead of throwing when token is absent or invalid.
  // passport-jwt calls validate(undefined) when no token is present.
  public validate(payload: JwtPayloadType): JwtPayloadType | null {
    if (!payload?.id) return null;
    return payload;
  }
}
