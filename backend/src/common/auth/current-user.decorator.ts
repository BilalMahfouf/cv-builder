import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserContext {
  userId: string;
  userName: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserContext => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return request.user as CurrentUserContext;
  },
);
