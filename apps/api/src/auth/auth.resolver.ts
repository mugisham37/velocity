import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginInput, AuthPayload, RefreshTokenInput } from './dto/auth.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import type { User } from '@kiro/database';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  @UseGuards(LocalAuthGuard)
  async login(
    @Args('input') input: LoginInput,
    @Context() context: any
  ): Promise<AuthPayload> {
    const user = context.user;
    const result = await this.authService.login(user);
    
    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Mutation(() => AuthPayload)
  async refreshToken(
    @Args('input') input: RefreshTokenInput
  ): Promise<AuthPayload> {
    const result = await this.authService.refreshToken(input.refreshToken);
    
    return {
      user: result.user,
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
}