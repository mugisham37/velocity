import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class GenerateInsightsInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  entityId: string;
}
