import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { OrderStatusConflictException } from '../../application/atendimento/errors/order-status-conflict.exception';
import { JsonLogger } from './json-logger.service';

@Catch(OrderStatusConflictException)
export class OrderStatusConflictFilter implements ExceptionFilter {
  private readonly logger = new JsonLogger();

  catch(exception: OrderStatusConflictException, host: ArgumentsHost): void {
    this.logger.error(
      { event: 'os_transicao_erro', message: exception.message },
      'OrderStatus',
    );

    const response = host.switchToHttp().getResponse<Response>();
    response.status(exception.getStatus()).json(exception.getResponse());
  }
}
