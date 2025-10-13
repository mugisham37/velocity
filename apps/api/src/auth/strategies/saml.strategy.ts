import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-saml';
import { samlConfig } from '@kiro/config';

@Injectable()
export class SamlStrategy extends PassportStrategy(Strategy, 'saml') {
  constructor() {
    super({
      entryPoint: samlConfig.entryPoint,
      issuer: samlConfig.issuer,
      cert: samlConfig.cert,
      callbackUrl: '/auth/saml/callback',
      authnRequestBinding: 'HTTP-POST',
      identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
      signatureAlgorithm: 'sha256',
      digestAlgorithm: 'sha256',
    });
  }

  async validate(profile: any): Promise<any> {
    const { nameID, attributes } = profile;

    const user = {
      email: nameID,
      firstName: attributes?.firstName?.[0] || attributes?.givenName?.[0],
      lastName: attributes?.lastName?.[0] || attributes?.surname?.[0],
      department: attributes?.department?.[0],
      title: attributes?.title?.[0],
      groups: attributes?.groups || [],
    };

    return user;
  }
}
