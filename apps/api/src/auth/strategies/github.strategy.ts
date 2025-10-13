import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { oauthConfig } from '../../config';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: oauthConfig.github.clientId,
      clientSecret: oauthConfig.github.clientSecret,
      callbackURL: '/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any
  ): Promise<any> {
    const { username, displayName, emails, photos } = profile;
    
    const user = {
      email: emails[0].value,
      firstName: displayName?.split(' ')[0] || username,
      lastName: displayName?.split(' ')[1] || '',
      picture: photos[0].value,
      accessToken,
      refreshToken,
    };
    
    return user;
  }
}
