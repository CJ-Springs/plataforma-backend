import { PaymentStatus } from '@prisma/client'
import { Injectable } from '@nestjs/common'

import { Deposit } from '../aggregate/deposit.aggregate'
import { DepositMadeEvent } from '../events/impl/deposit-made.event'
import { DepositCanceledEvent } from '../events/impl/deposit-canceled.event'
import { DepositRemainingUpdatedEvent } from '../events/impl/deposit-remaining-updated.event'
import { IRepository } from '@/.shared/types'
import { LoggerService, Result } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'

@Injectable()
export class DepositRepository implements IRepository<Deposit> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findOneById(id: string): Promise<Result<Deposit>> {
    try {
      const deposit = await this.prisma.deposit.findUnique({
        where: { id },
      })

      if (!deposit) {
        return null
      }

      return Deposit.create({
        ...deposit,
        metadata: deposit.metadata as object,
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar buscar el depósito ${id} en la db`,
      )
      return null
    }
  }

  async save(deposit: Deposit): Promise<void> {
    const events = deposit.getUncommittedEvents()

    await Promise.all(
      events.map((event) => {
        if (event instanceof DepositMadeEvent) {
          return this.makeDeposit(event.data)
        }
        if (event instanceof DepositCanceledEvent) {
          return this.cancelDeposit(event.data)
        }
        if (event instanceof DepositRemainingUpdatedEvent) {
          return this.updateDepositRemaining(event.data)
        }
      }),
    )
  }

  private async makeDeposit(deposit: DepositMadeEvent['data']) {
    console.log({ deposit })

    try {
      await this.prisma.deposit.create({
        data: {
          ...deposit,
          metadata: deposit.metadata,
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar crear el depósito ${deposit.id} en la db`,
      )
    }
  }

  private async cancelDeposit(data: DepositCanceledEvent['data']) {
    try {
      await this.prisma.deposit.update({
        where: {
          id: data.depositId,
        },
        data: {
          canceledBy: data.canceledBy,
          status: PaymentStatus.ANULADO,
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar anular el depósito ${data.depositId} en la db`,
      )
    }
  }

  private async updateDepositRemaining(
    data: DepositRemainingUpdatedEvent['data'],
  ) {
    try {
      await this.prisma.deposit.update({
        where: {
          id: data.id,
        },
        data: {
          remaining: data.remaining,
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar actualizar el sobrante del depósito ${data.id} en la db`,
      )
    }
  }
}
