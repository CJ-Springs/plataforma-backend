import { InvoiceStatus } from '@prisma/client'
import { AggregateRoot } from '@nestjs/cqrs'

import { InvoiceGeneratedEvent } from '../events/impl/invoice-generated.event'
import { InvoiceDuedEvent } from '../events/impl/invoice-dued.event'
import { IToDTO } from '@/.shared/types'
import { UniqueEntityID } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'

type InvoiceProps = {
  id: UniqueEntityID
  total: number
  deposited: number
  dueDate: Date
  status: InvoiceStatus
  orderId: UniqueEntityID
}

type InvoicePropsDTO = {
  id: string
  total: number
  deposited: number
  dueDate: Date
  status: InvoiceStatus
  orderId: string
}

export class Invoice extends AggregateRoot implements IToDTO<InvoicePropsDTO> {
  private constructor(public props: InvoiceProps) {
    super()
  }

  static create(props: Partial<InvoicePropsDTO>): Result<Invoice> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.total, argumentName: 'total' },
      { argument: props.deposited, argumentName: 'deposited' },
      { argument: props.dueDate, argumentName: 'dueDate' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.orderId, argumentName: 'orderId' },
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }
    const invoice = new Invoice({
      id: new UniqueEntityID(props?.id),
      total: props.total,
      deposited: props.deposited,
      dueDate: props.dueDate,
      status: props.status,
      orderId: new UniqueEntityID(props.orderId),
    })

    if (!props?.id) {
      const event = new InvoiceGeneratedEvent(invoice.toDTO())
      invoice.apply(event)
    }

    return Result.ok<Invoice>(invoice)
  }

  due(): Result<Invoice> {
    const invoiceCurrentStatus = this.props.status

    if (invoiceCurrentStatus === InvoiceStatus.PAGADA) {
      return Result.fail('La factura ya fue pagada')
    }
    if (invoiceCurrentStatus === InvoiceStatus.DEUDA) {
      return Result.fail('La factura ya fue marcada como deuda')
    }

    if (this.props.dueDate > new Date()) {
      return Result.fail(
        'La factura todavía no ha cumplido su fecha de vencimiento',
      )
    }

    this.props.status = InvoiceStatus.DEUDA

    const event = new InvoiceDuedEvent({ id: this.props.id.toString() })
    this.apply(event)

    return Result.ok<Invoice>(this)
  }

  toDTO(): InvoicePropsDTO {
    return {
      ...this.props,
      id: this.props.id.toString(),
      orderId: this.props.orderId.toString(),
    }
  }
}
