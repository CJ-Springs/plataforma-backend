import { IncomeOrderStatus } from '@prisma/client'
import { AggregateRoot } from '@nestjs/cqrs'

import {
  IncomeOrderItem,
  IncomeOrderItemPropsDTO,
} from './entities/income-order-item.entity'
import { IncomeOrderPlacedEvent } from '../events/impl/income-order-placed.event'
import { ItemAddedEvent } from '../events/impl/item-added.event'
import { ItemQuantityIncrementedEvent } from '../events/impl/item-quantity-incremented.event'
import { IToDTO } from '@/.shared/types'
import { UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'

type IncomeOrderProps = {
  id: UniqueEntityID
  status: IncomeOrderStatus
  userId: UniqueEntityID
  items: IncomeOrderItem[]
}

type IncomeOrderPropsDTO = {
  id: string
  status: IncomeOrderStatus
  userId: string
  items: IncomeOrderItemPropsDTO[]
}

export class IncomeOrder
  extends AggregateRoot
  implements IToDTO<IncomeOrderPropsDTO>
{
  private constructor(public props: IncomeOrderProps) {
    super()
  }

  static create(props: Partial<IncomeOrderPropsDTO>): Result<IncomeOrder> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.status, argumentName: 'status' },
      { argument: props.userId, argumentName: 'userId' },
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const items: IncomeOrderItem[] = []

    if (props.items) {
      for (const item of props.items) {
        const itemOrError = IncomeOrderItem.create(item)
        if (itemOrError.isFailure) {
          return Result.fail(itemOrError.getErrorValue())
        }

        items.push(itemOrError.getValue())
      }
    }

    const incomeOrder = new IncomeOrder({
      id: new UniqueEntityID(props?.id),
      status: props.status,
      userId: new UniqueEntityID(props.userId),
      items,
    })

    if (!props?.id) {
      const data = incomeOrder.toDTO()

      const event = new IncomeOrderPlacedEvent({
        id: data.id,
        status: data.status,
        userId: data.userId,
      })
      incomeOrder.apply(event)
    }

    return Result.ok<IncomeOrder>(incomeOrder)
  }

  addItem({ entered, productCode }: Omit<IncomeOrderItemPropsDTO, 'id'>) {
    const existingItem = this.props.items.find((item) =>
      item.props.productCode.equals(new UniqueField(productCode)),
    )

    if (existingItem) {
      existingItem.incrementQuantity(entered)

      const event = new ItemQuantityIncrementedEvent(existingItem.toDTO())
      this.apply(event)
    } else {
      const itemOrError = IncomeOrderItem.create({ entered, productCode })
      if (itemOrError.isFailure) {
        return Result.fail(itemOrError.getErrorValue())
      }
      const item = itemOrError.getValue()

      this.props.items.push(item)

      const event = new ItemAddedEvent({
        ...item.toDTO(),
        orderId: this.props.id.toString(),
      })
      this.apply(event)
    }
  }

  toDTO(): IncomeOrderPropsDTO {
    return {
      ...this.props,
      id: this.props.id.toString(),
      userId: this.props.userId.toString(),
      items: this.props.items.map((item) => item.toDTO()),
    }
  }
}
