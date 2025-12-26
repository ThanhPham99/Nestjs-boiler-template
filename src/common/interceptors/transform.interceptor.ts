import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Message } from '@common/enums/messages.enum';

export const RESPONSE_MESSAGE = 'response_message';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Lấy message tùy chỉnh từ Decorator (nếu có) hoặc dùng mặc định
    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE, context.getHandler()) ||
      Message.SUCCESS;

    response.locals.status = message;

    return next.handle().pipe(
      map((data) => ({
        errorCode: message,
        message,
        data,
        timestamp: new Date().toISOString(),
        path: request.url,
      })),
    );
  }
}
