import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class TransactionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const transactionId = randomUUID();
    (req as any).transactionId = transactionId;
    next();
  }
}
