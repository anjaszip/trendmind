import { Injectable, LoggerService } from '@nestjs/common';

type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

@Injectable()
export class AppLogger implements LoggerService {
  private readonly isProduction = process.env.NODE_ENV === 'production';

  private write(level: LogLevel, message: unknown, context?: string, trace?: string): void {
    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      context: context ?? 'App',
      message: typeof message === 'string' ? message : JSON.stringify(message),
    };
    if (trace) entry.trace = trace;

    if (this.isProduction) {
      process.stdout.write(JSON.stringify(entry) + '\n');
    } else {
      const prefix = `[${entry.timestamp}] [${level.toUpperCase().padEnd(7)}] [${entry.context}]`;
      if (level === 'error') {
        console.error(`${prefix} ${entry.message}${trace ? `\n${trace}` : ''}`);
      } else if (level === 'warn') {
        console.warn(`${prefix} ${entry.message}`);
      } else {
        console.log(`${prefix} ${entry.message}`);
      }
    }
  }

  log(message: unknown, context?: string): void {
    this.write('log', message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write('error', message, context, trace);
  }

  warn(message: unknown, context?: string): void {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    if (!this.isProduction) this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    if (!this.isProduction) this.write('verbose', message, context);
  }
}
