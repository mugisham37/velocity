import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MinLength(6)
  password: string;
}

@InputType()
export class RefreshTokenInput {
  @Field()
  @IsString()
  refreshToken: string;
}

@ObjectType()
export class UserType {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  isActive: boolean;

  @Field()
  companyId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class AuthPayload {
  @Field(() => UserType)
  user: UserType;

  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;
}