declare module 'passport-local' {
  import { Strategy as PassportStrategy } from 'passport';

  export interface IStrategyOptions {
    usernameField?: string;
    passwordField?: string;
    passReqToCallback?: boolean;
  }

  export interface IVerifyOptions {
    message: string;
  }

  export interface VerifyFunction {
    (username: string, password: string, done: (error: any, user?: any, options?: IVerifyOptions) => void): void;
  }

  export interface VerifyFunctionWithRequest {
    (req: any, username: string, password: string, done: (error: any, user?: any, options?: IVerifyOptions) => void): void;
  }

  export class Strategy extends PassportStrategy {
    constructor(options: IStrategyOptions, verify: VerifyFunction);
    constructor(options: IStrategyOptions, verify: VerifyFunctionWithRequest);
    constructor(verify: VerifyFunction);
    
    name: string;
  }
}
