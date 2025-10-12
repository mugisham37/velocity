import { Query, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => String)
  async userServiceStatus(): Promise<string> {
    // Simple resolver to use the service and avoid unused variable warning
    // This could be expanded to actually check service health
    const serviceExists = !!this.usersService;
    return serviceExists ? 'Users service is active' : 'Users service unavailable';
  }

  // TODO: Add GraphQL resolvers as needed
  // Example resolver:
  // @Query(() => User, { nullable: true })
  // async user(@Args('id') id: string): Promise<User | null> {
  //   return this.usersService.findById(id);
  // }
}