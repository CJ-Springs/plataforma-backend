import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getResponse<any>();

    const statusCode = exception.getStatus();
    const errorResponse = exception.getResponse();

    response.status(statusCode).json({
      path: request.req.url,
      method: request.req.method,
      timestamp: new Date().toISOString(),
      error:
        typeof errorResponse === 'object'
          ? { ...errorResponse }
          : { error: errorResponse },
    });
  }
}
