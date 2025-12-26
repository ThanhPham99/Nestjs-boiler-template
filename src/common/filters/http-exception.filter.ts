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
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    // this.logger.log(exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse: any =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: Message.ERROR };

    let errorDetails = null;
    let message = exceptionResponse.message || Message.ERROR;

    // Xử lý Validation Error
    if (status === HttpStatus.BAD_REQUEST) {
      // Kiểm tra xem message có phải là cấu trúc lỗi validation custom của mình không
      // Vì ở main.ts ta đã trả về object/array trong BadRequestException
      message = Message.VALIDATION_ERROR;
      errorDetails = exceptionResponse.message;
    }

    response.locals.status = message;

    const errorResponse: ApiResponse<null> = {
      errorCode: message,
      data: null,
      errors: errorDetails, // Lúc này errorDetails sẽ là Array các Object chi tiết
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(200).json(errorResponse);
  }
}
