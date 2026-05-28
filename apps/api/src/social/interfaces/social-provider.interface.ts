import { SocialInterface } from './social.interface';

export interface SocialProviderService<T = unknown> {
  getProfileByToken(loginDto: T): Promise<SocialInterface>;
}
