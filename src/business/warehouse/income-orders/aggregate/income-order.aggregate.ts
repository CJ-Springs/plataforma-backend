import { IncomeOrderStatus } from '@prisma/client'
import { AggregateRoot } from '@nestjs/cqrs'

import {
  IncomeOrderItem,
  IncomeOrderItemPropsDTO,
} from './entities/income-order-item.entity'
import { IncomeOrderPlacedEvent } from '../events/impl/income-order-placed.event'
import { DeepPartial, IToDTO } from '@/.shared/types'
import { UniqueEntityID } from '@/.shared/domain'
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

  static create(props: DeepPartial<IncomeOrderPropsDTO>): Result<IncomeOrder> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.status, argumentName: 'status' },
      { argument: props.userId, argumentName: 'userId' },
      { argument: props.items, argumentName: 'items' },
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const items: IncomeOrderItem[] = []

    for (const item of props.items) {
      const itemOrError = IncomeOrderItem.create(item)
      if (itemOrError.isFailure) {
        return Result.fail(itemOrError.getErrorValue())
      }

      items.push(itemOrError.getValue())
    }

    const incomeOrder = new IncomeOrder({
      id: new UniqueEntityID(props?.id),
      status: props.status,
      userId: new UniqueEntityID(props.userId),
      items,
    })

    if (!props?.id) {
      const event = new IncomeOrderPlacedEvent(incomeOrder.toDTO())
      incomeOrder.apply(event)
    }

    return Result.ok<IncomeOrder>(incomeOrder)
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
