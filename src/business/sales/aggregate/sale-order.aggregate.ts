import { AggregateRoot } from '@nestjs/cqrs'

import {
  SaleOrderItem,
  SaleOrderItemPropsDTO,
} from './entities/sale-order-item.entity'
import { SaleOrderPlacedEvent } from '../events/impl/sale-order-placed.event'
import { DeepPartial, IToDTO } from '@/.shared/types'
import { UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'

type SaleOrderProps = {
  id: UniqueEntityID
  createdBy: string
  customerCode: UniqueField<number>
  items: SaleOrderItem[]
}

type SaleOrderPropsDTO = {
  id: string
  createdBy: string
  customerCode: number
  items: SaleOrderItemPropsDTO[]
}

export class SaleOrder
  extends AggregateRoot
  implements IToDTO<SaleOrderPropsDTO>
{
  private constructor(public props: SaleOrderProps) {
    super()
  }

  static create(props: DeepPartial<SaleOrderPropsDTO>): Result<SaleOrder> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.createdBy, argumentName: 'createdBy' },
      { argument: props.customerCode, argumentName: 'customerCode' },
      { argument: props.items, argumentName: 'items' },
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const items: SaleOrderItem[] = []

    for (const item of props.items) {
      const itemOrError = SaleOrderItem.create(item)
      if (itemOrError.isFailure) {
        return Result.fail(itemOrError.getErrorValue())
      }

      items.push(itemOrError.getValue())
    }

    const saleOrder = new SaleOrder({
      id: new UniqueEntityID(props?.id),
      createdBy: props.createdBy,
      customerCode: new UniqueField(props.customerCode),
      items,
    })

    if (!props?.id) {
      const event = new SaleOrderPlacedEvent(saleOrder.toDTO())
      saleOrder.apply(event)
    }

    return Result.ok<SaleOrder>(saleOrder)
  }

  toDTO(): SaleOrderPropsDTO {
    return {
      ...this.props,
      id: this.props.id.toString(),
      customerCode: this.props.customerCode.toValue(),
      items: this.props.items.map((item) => item.toDTO()),
    }
  }
}
