import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Message } from '@common/enums/messages.enum';
import { ApiResponse } from '@common/interfaces/api-response.interface';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export const RESPONSE_MESSAGE = 'response_message';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const http_context = context.switchToHttp();
    const response = http_context.getResponse<Response>();
    const request = http_context.getRequest<Request>();

    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE, context.getHandler()) ||
      Message.SUCCESS;

    response.locals.status = message;

    return next.handle().pipe(
      map((data) => ({
        error_code: message,
        message,
        data,
        timestamp: new Date().toISOString(),
        path: request.url,
      })),
    );
  }
}
