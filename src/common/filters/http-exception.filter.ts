import { Message } from '@common/enums/messages.enum';
import { ApiResponse } from '@common/interfaces/api-response.interface';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

type ExceptionResponseBody = {
  message?: unknown;
};

type ExceptionResponse = string | ExceptionResponseBody;

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exception_response: ExceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: Message.ERROR };

    if (!(exception instanceof HttpException)) {
      this.logger.error(exception);
    }

    const error_details =
      status === HttpStatus.BAD_REQUEST
        ? this.extractMessage(exception_response)
        : null;
    const message =
      status === HttpStatus.BAD_REQUEST
        ? Message.VALIDATION_ERROR
        : this.toErrorCode(this.extractMessage(exception_response));

    response.locals.status = message;

    const error_response: ApiResponse<null> = {
      error_code: message,
      message,
      data: null,
      errors: error_details,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(HttpStatus.OK).json(error_response);
  }

  private extractMessage(exception_response: ExceptionResponse): unknown {
    if (typeof exception_response === 'string') {
      return exception_response;
    }

    return exception_response.message ?? Message.ERROR;
  }

  private toErrorCode(message: unknown): string {
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }

    return Message.ERROR;
  }
}
