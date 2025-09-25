import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MinLength(6)
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  mfaToken?: string;
}

@InputType()
export class RefreshTokenInput {
  @Field()
  @IsString()
  refreshToken: string;
}

@InputType()
export class EnableMfaInput {
  @Field()
  @IsString()
  @Length(6, 6)
  token: string;
}

@InputType()
export class DisableMfaInput {
  @Field()
  @IsString()
  @Length(6, 8)
  token: string;
}

@InputType()
export class RegenerateBackupCodesInput {
  @Field()
  @IsString()
  @Length(6, 8)
  token: string;
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

  @Field({ nullable: true })
  requiresMfa?: boolean;
}

@ObjectType()
export class MfaSetupPayload {
  @Field()
  secret: string;

  @Field()
  qrCodeUrl: string;

  @Field(() => [String])
  backupCodes: string[];
}

@ObjectType()
export class BackupCodesPayload {
  @Field(() => [String])
  backupCodes: string[];
}
