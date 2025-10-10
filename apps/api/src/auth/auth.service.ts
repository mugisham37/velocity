import { jwtConfig } from '@kiro/config';
import type { User } from '@kiro/database';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { MfaService } from './services/mfa.service';

export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
  roles: string[];
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  requiresMfa?: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mfaService: MfaService
  ) {}

  async validateUser(
    email: string,
    password: string,
    mfaToken?: string
  ): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!mfaToken) {
        throw new UnauthorizedException('MFA token required');
      }

      const isMfaValid = await this.mfaService.verifyMfaToken(
        user.id,
        mfaToken
      );
      if (!isMfaValid) {
        throw new UnauthorizedException('Invalid MFA token');
      }
    }

    return user;
  }

  async login(user: User): Promise<AuthResult> {
    // Get user roles
    const roles = await this.usersService.getUserRoles(user.id);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      roles: roles.map((role: { name: string }) => role.name),
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtConfig.refreshSecret,
      expiresIn: jwtConfig.refreshExpiresIn,
    });

    // Store session in database
    await this.usersService.createSession(user.id, accessToken, refreshToken);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: jwtConfig.refreshSecret,
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Validate session exists
      const session =
        await this.usersService.findSessionByRefreshToken(refreshToken);
      if (!session || !session.isActive) {
        throw new UnauthorizedException('Session expired');
      }

      return this.login(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(_userId: string, accessToken: string): Promise<void> {
    await this.usersService.revokeSession(accessToken);
  }

  async validateJwtPayload(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
