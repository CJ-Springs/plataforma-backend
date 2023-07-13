import { AggregateRoot } from '@nestjs/cqrs'

import {
  WarrantyOrderItem,
  WarrantyOrderItemPropsDTO,
} from './entities/warranty-order-item.entity'
import { WarrantyOrderCreatedEvent } from '../events/impl/warranty-order-created.event'
import { DeepPartial, IToDTO } from '@/.shared/types'
import { UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'

type WarrantyOrderProps = {
  id: UniqueEntityID
  createdBy: string
  customerCode: UniqueField<number>
  observation?: string
  items: WarrantyOrderItem[]
}

type WarrantyOrderPropsDTO = {
  id: string
  createdBy: string
  customerCode: number
  observation?: string
  items: WarrantyOrderItemPropsDTO[]
}

export class WarrantyOrder
  extends AggregateRoot
  implements IToDTO<WarrantyOrderPropsDTO>
{
  private constructor(public props: WarrantyOrderProps) {
    super()
  }

  static create(
    props: DeepPartial<WarrantyOrderPropsDTO>,
  ): Result<WarrantyOrder> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.createdBy, argumentName: 'createdBy' },
      { argument: props.customerCode, argumentName: 'customerCode' },
      { argument: props.items, argumentName: 'items' },
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const items: WarrantyOrderItem[] = []

    for (const item of props.items) {
      const itemOrError = WarrantyOrderItem.create(item)
      if (itemOrError.isFailure) {
        return Result.fail(itemOrError.getErrorValue())
      }

      items.push(itemOrError.getValue())
    }

    const warrantyOrder = new WarrantyOrder({
      id: new UniqueEntityID(props?.id),
      createdBy: props.createdBy,
      customerCode: new UniqueField(props.customerCode),
      observation: props?.observation,
      items,
    })

    if (!props?.id) {
      const event = new WarrantyOrderCreatedEvent(warrantyOrder.toDTO())
      warrantyOrder.apply(event)
    }

    return Result.ok<WarrantyOrder>(warrantyOrder)
  }

  toDTO(): WarrantyOrderPropsDTO {
    return {
      ...this.props,
      id: this.props.id.toString(),
      customerCode: this.props.customerCode.toValue(),
      items: this.props.items.map((item) => item.toDTO()),
    }
  }
}
