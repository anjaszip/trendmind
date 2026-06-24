import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred. Please try again later.';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        message = (b.message as string) ?? message;
        error = (b.error as string) ?? error;
      }
      error = exception.name;
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
    } else {
      this.logger.error(`Unknown exception type`, JSON.stringify(exception));
    }

    const USER_MESSAGES: Record<number, string> = {
      400: 'Invalid request — please check your input.',
      401: 'Authentication required. Please log in.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      409: 'This resource already exists.',
      422: 'Validation failed — please check your input.',
      429: 'Too many requests. Please slow down and try again later.',
      500: 'Something went wrong on our end. Please try again later.',
      502: 'Upstream service unavailable. Please try again in a moment.',
      503: 'Service temporarily unavailable. Please try again later.',
    };

    response.status(status).json({
      statusCode: status,
      error,
      message: USER_MESSAGES[status] ?? message,
      detail: status < 500 ? message : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
