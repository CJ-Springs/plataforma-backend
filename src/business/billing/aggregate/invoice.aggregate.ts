import { InvoiceStatus } from '@prisma/client'
import { AggregateRoot } from '@nestjs/cqrs'

import { Payment, PaymentPropsDTO } from './entities/payment.entity'
import { InvoiceGeneratedEvent } from '../events/impl/invoice-generated.event'
import { InvoiceDuedEvent } from '../events/impl/invoice-dued.event'
import { PaymentAppendedEvent } from '../events/impl/payment-appended.event'
import { DeepPartial, IToDTO } from '@/.shared/types'
import { UniqueEntityID } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'

type InvoiceProps = {
  id: UniqueEntityID
  total: number
  deposited: number
  dueDate: Date
  status: InvoiceStatus
  orderId: UniqueEntityID
  payments: Payment[]
}

type InvoicePropsDTO = {
  id: string
  total: number
  deposited: number
  dueDate: Date
  status: InvoiceStatus
  orderId: string
  payments: PaymentPropsDTO[]
}

export class Invoice extends AggregateRoot implements IToDTO<InvoicePropsDTO> {
  private constructor(public props: InvoiceProps) {
    super()
  }

  static create(
    props: DeepPartial<Omit<InvoicePropsDTO, 'dueDate'>> &
      Partial<Pick<InvoicePropsDTO, 'dueDate'>>,
  ): Result<Invoice> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.total, argumentName: 'total' },
      { argument: props.deposited, argumentName: 'deposited' },
      { argument: props.dueDate, argumentName: 'dueDate' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.orderId, argumentName: 'orderId' },
      { argument: props.payments, argumentName: 'payments' },
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const payments: Payment[] = []

    for (const payment of props.payments) {
      const paymentOrError = Payment.create(payment)
      if (paymentOrError.isFailure) {
        return Result.fail(paymentOrError.getErrorValue())
      }
      payments.push(paymentOrError.getValue())
    }

    const invoice = new Invoice({
      id: new UniqueEntityID(props?.id),
      total: props.total,
      deposited: props.deposited,
      dueDate: props.dueDate,
      status: props.status,
      orderId: new UniqueEntityID(props.orderId),
      payments,
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

  appendPayment(props: Partial<PaymentPropsDTO>): Result<Invoice> {
    if (this.props.status === InvoiceStatus.PAGADA) {
      return Result.fail('La factura ya ha sido pagada en su totalidad')
    }

    const paymentOrError = Payment.create(props)
    if (paymentOrError.isFailure) {
      return Result.fail(paymentOrError.getErrorValue())
    }
    const payment = paymentOrError.getValue()

    if (this.props.deposited + payment.props.amount > this.props.total) {
      return Result.fail(
        `El pago (monto del pago $${
          payment.props.amount
        }) excede lo que queda por pagar de la factura (por pagar $${
          this.props.total - this.props.deposited
        })`,
      )
    }

    this.props.payments.push(payment)
    this.props.deposited += payment.props.amount

    const event = new PaymentAppendedEvent({
      invoiceId: this.props.id.toString(),
      deposited: this.props.deposited,
      total: this.props.total,
      payment: payment.toDTO(),
    })
    this.apply(event)

    return Result.ok<Invoice>(this)
  }

  toDTO(): InvoicePropsDTO {
    return {
      ...this.props,
      id: this.props.id.toString(),
      orderId: this.props.orderId.toString(),
      payments: this.props.payments.map((payment) => payment.toDTO()),
    }
  }
}
