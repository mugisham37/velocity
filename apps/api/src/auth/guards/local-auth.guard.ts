import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().request || ctx.getContext().req;
    const args = ctx.getArgs();
    
    // Extract credentials from GraphQL args
    if (args.input) {
      request.body = {
        email: args.input.email,
        password: args.input.password,
      };
    }
    
    return request;
  }
}