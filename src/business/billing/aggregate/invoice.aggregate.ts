import { Currencies, InvoiceStatus } from '@prisma/client'
import { AggregateRoot } from '@nestjs/cqrs'

import { Payment, PaymentPropsDTO } from './entities/payment.entity'
import { InvoiceGeneratedEvent } from '../events/impl/invoice-generated.event'
import { InvoiceDuedEvent } from '../events/impl/invoice-dued.event'
import { PaymentAddedEvent } from '../events/impl/payment-added.event'
import { PaymentCanceledEvent } from '../events/impl/payment-canceled.event'
import { DeepPartial, IToDTO } from '@/.shared/types'
import { UniqueEntityID } from '@/.shared/domain'
import { Result, Validate, DateTime, Money, Currency } from '@/.shared/helpers'

type InvoiceProps = {
  id: UniqueEntityID
  total: Money
  deposited: Money
  dueDate: DateTime
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
    props: Partial<Omit<InvoicePropsDTO, 'payments'>> &
      DeepPartial<Pick<InvoicePropsDTO, 'payments'>>,
  ): Result<Invoice> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.dueDate, argumentName: 'dueDate' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.orderId, argumentName: 'orderId' },
      { argument: props.payments, argumentName: 'payments' },
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const validateTotal = Money.validate(props.total, 'total', {
      validateIsGreaterThanZero: true,
    })
    if (validateTotal.isFailure) {
      return Result.fail(validateTotal.getErrorValue())
    }

    const validateDeposited = Money.validate(props.deposited, 'deposited', {
      validateIsGreaterOrEqualThanZero: true,
    })
    if (validateDeposited.isFailure) {
      return Result.fail(validateDeposited.getErrorValue())
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
      id: new UniqueEntityID(props.id),
      total: Money.fromString(
        String(props.total),
        Currency.create(Currencies.ARS),
      ),
      deposited: Money.fromString(
        String(props.deposited),
        Currency.create(Currencies.ARS),
      ),
      dueDate: DateTime.createFromDate(props.dueDate, false),
      status: props.status,
      orderId: new UniqueEntityID(props.orderId),
      payments,
    })

    if (!props.id) {
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

    if (this.props.dueDate.greaterThanOrEqual(DateTime.today())) {
      return Result.fail(
        'La factura todavía no ha cumplido su fecha de vencimiento',
      )
    }

    this.props.status = InvoiceStatus.DEUDA

    const event = new InvoiceDuedEvent({ id: this.props.id.toString() })
    this.apply(event)

    return Result.ok<Invoice>(this)
  }

  addPayment(props: Partial<PaymentPropsDTO>): Result<Invoice> {
    if (this.props.status === InvoiceStatus.PAGADA) {
      return Result.fail('La factura ya ha sido pagada en su totalidad')
    }

    const paymentOrError = Payment.create(props)
    if (paymentOrError.isFailure) {
      return Result.fail(paymentOrError.getErrorValue())
    }
    const payment = paymentOrError.getValue()

    const remaining =
      payment.props.amount.getValue() -
      (this.props.total.getValue() - this.props.deposited.getValue())
    if (remaining > 0) {
      payment.addToRemaining(remaining)
    }

    this.props.payments.push(payment)
    this.props.deposited = this.props.deposited.add(payment.props.amount)

    if (this.props.deposited.getValue() === this.props.total.getValue()) {
      this.props.status = InvoiceStatus.PAGADA
    }

    const event = new PaymentAddedEvent({
      invoiceId: this.props.id.toString(),
      orderId: this.props.orderId.toString(),
      status: this.props.status,
      payment: payment.toDTO(),
    })
    this.apply(event)

    return Result.ok<Invoice>(this)
  }

  cancelPayment(paymentId: string, canceledBy: string): Result<Invoice> {
    const payment = this.findPayment(paymentId)
    if (!payment) {
      return Result.fail(`No se ha encontrado el pago ${paymentId}`)
    }

    const cancelPaymentResult = payment.cancel(canceledBy)
    if (cancelPaymentResult.isFailure) {
      return Result.fail(cancelPaymentResult.getErrorValue())
    }

    this.props.deposited = this.props.deposited.substract(payment.props.amount)

    if (this.props.status === InvoiceStatus.PAGADA) {
      if (this.props.dueDate.greaterThanOrEqual(DateTime.today())) {
        this.props.status = InvoiceStatus.POR_PAGAR
      } else {
        this.props.status = InvoiceStatus.DEUDA
      }
    }

    const event = new PaymentCanceledEvent({
      invoiceId: this.props.id.toString(),
      orderId: this.props.orderId.toString(),
      status: this.props.status,
      payment: {
        id: payment.toDTO().id,
        amount: payment.props.amount.getValue(),
        remaining: payment.props.remaining.getValue(),
        canceledBy: payment.props.canceledBy,
      },
    })
    this.apply(event)

    return Result.ok<Invoice>(this)
  }

  findPayment(paymentId: string): Payment {
    return this.props.payments.find(
      (payment) => payment.toDTO().id === paymentId,
    )
  }

  toDTO(): InvoicePropsDTO {
    return {
      ...this.props,
      id: this.props.id.toString(),
      total: this.props.total.getValue(),
      deposited: this.props.deposited.getValue(),
      dueDate: this.props.dueDate.getDate(),
      orderId: this.props.orderId.toString(),
      payments: this.props.payments.map((payment) => payment.toDTO()),
    }
  }
}
