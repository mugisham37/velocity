import type { User } from '../database';
import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { 
  AuthPayload, 
  LoginInput, 
  RefreshTokenInput,
  MfaSetupPayload,
  EnableMfaInput,
  DisableMfaInput,
  BackupCodesPayload,
  RegenerateBackupCodesInput,
  UserType
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { MfaService } from './services/mfa.service';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly mfaService: MfaService
  ) {}

  @Mutation(() => AuthPayload)
  @UseGuards(LocalAuthGuard)
  async login(
    @Args('input') _input: LoginInput,
    @Context() context: any
  ): Promise<AuthPayload> {
    const user = context.user;
    const result = await this.authService.login(user);

    // Transform database user to UserType
    const userType: UserType = {
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      isActive: result.user.isActive,
      companyId: result.user.companyId,
      createdAt: result.user.createdAt,
      updatedAt: result.user.updatedAt,
    };

    return {
      user: userType,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Mutation(() => AuthPayload)
  async refreshToken(
    @Args('input') input: RefreshTokenInput
  ): Promise<AuthPayload> {
    const result = await this.authService.refreshToken(input.refreshToken);

    // Transform database user to UserType
    const userType: UserType = {
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      isActive: result.user.isActive,
      companyId: result.user.companyId,
      createdAt: result.user.createdAt,
      updatedAt: result.user.updatedAt,
    };

    return {
      user: userType,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: User,
    @Context() context: any
  ): Promise<boolean> {
    const token = context.req.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(user.id, token);
    return true;
  }

  @Mutation(() => MfaSetupPayload)
  @UseGuards(JwtAuthGuard)
  async setupMfa(@CurrentUser() user: User): Promise<MfaSetupPayload> {
    return this.mfaService.generateMfaSecret(user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async enableMfa(
    @CurrentUser() user: User,
    @Args('input') input: EnableMfaInput
  ): Promise<boolean> {
    return this.mfaService.enableMfa(user.id, input.token);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async disableMfa(
    @CurrentUser() user: User,
    @Args('input') input: DisableMfaInput
  ): Promise<boolean> {
    return this.mfaService.disableMfa(user.id, input.token);
  }

  @Mutation(() => BackupCodesPayload)
  @UseGuards(JwtAuthGuard)
  async regenerateBackupCodes(
    @CurrentUser() user: User,
    @Args('input') input: RegenerateBackupCodesInput
  ): Promise<BackupCodesPayload> {
    const backupCodes = await this.mfaService.regenerateBackupCodes(
      user.id,
      input.token
    );
    return { backupCodes };
  }
}

