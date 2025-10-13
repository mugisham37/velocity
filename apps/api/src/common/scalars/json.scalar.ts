import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('JSONObject', () => Object)
export class JSONObjectScalar implements CustomScalar<object, object> {
  description = 'JSON object custom scalar type';

  parseValue(value: unknown): object {
    return value as object; // value from the client
  }

  serialize(value: unknown): object {
    return value as object; // value sent to the client
  }

  parseLiteral(ast: ValueNode): object {
    if (ast.kind === Kind.OBJECT) {
      return this.parseObject(ast);
    }
    return {};
  }

  private parseObject(ast: any): object {
    const value = Object.create(null);
    ast.fields.forEach((field: any) => {
      value[field.name.value] = this.parseLiteral(field.value);
    });
    return value;
  }
}
