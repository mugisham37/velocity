import { jwtConfig } from '../config';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { MfaService } from './services/mfa.service';
import { RbacService } from './services/rbac.service';
import { GitHubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { SamlStrategy } from './strategies/saml.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtConfig.secret,
      signOptions: { expiresIn: jwtConfig.expiresIn },
    }),
    UsersModule,
  ],
  providers: [
    AuthService,
    AuthResolver,
    MfaService,
    RbacService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    GitHubStrategy,
    SamlStrategy,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [
    AuthService,
    MfaService,
    RbacService,
    JwtModule,
    RolesGuard,
    PermissionsGuard,
  ],
})
export class AuthModule {}

