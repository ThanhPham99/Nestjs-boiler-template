import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

type RequestWithTransactionId = Request & {
  transaction_id?: string;
};

@Injectable()
export class TransactionMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const transaction_id = randomUUID();
    const request_with_transaction_id = req as RequestWithTransactionId;
    request_with_transaction_id.transaction_id = transaction_id;
    next();
  }
}
