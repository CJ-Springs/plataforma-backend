import { AggregateRoot } from '@nestjs/cqrs'

import {
  CreditNoteItem,
  CreditNoteItemPropsDTO,
} from './entities/credit-note-item.entity'
import { CreditNoteMadeEvent } from '../events/impl/credit-note-made.event'
import { DeepPartial, IToDTO } from '@/.shared/types'
import { UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'

type CreditNoteProps = {
  id: UniqueEntityID
  customerCode: UniqueField<number>
  createdBy: string
  observation?: string
  items: CreditNoteItem[]
}

type CreditNotePropsDTO = {
  id: string
  createdBy: string
  customerCode: number
  observation?: string
  items: CreditNoteItemPropsDTO[]
}

export class CreditNote
  extends AggregateRoot
  implements IToDTO<CreditNotePropsDTO>
{
  private constructor(public props: CreditNoteProps) {
    super()
  }

  static create(props: DeepPartial<CreditNotePropsDTO>): Result<CreditNote> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.createdBy, argumentName: 'createdBy' },
      { argument: props.customerCode, argumentName: 'customerCode' },
      { argument: props.items, argumentName: 'items' },
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const items: CreditNoteItem[] = []

    for (const item of props.items) {
      const itemOrError = CreditNoteItem.create(item)
      if (itemOrError.isFailure) {
        return Result.fail(itemOrError.getErrorValue())
      }

      items.push(itemOrError.getValue())
    }

    const creditNote = new CreditNote({
      id: new UniqueEntityID(props?.id),
      createdBy: props.createdBy,
      customerCode: new UniqueField(props.customerCode),
      observation: props?.observation,
      items,
    })

    if (!props?.id) {
      const event = new CreditNoteMadeEvent(creditNote.toDTO())
      creditNote.apply(event)
    }

    return Result.ok<CreditNote>(creditNote)
  }

  toDTO(): CreditNotePropsDTO {
    return {
      ...this.props,
      id: this.props.id.toString(),
      customerCode: this.props.customerCode.toValue(),
      items: this.props.items.map((item) => item.toDTO()),
    }
  }
}
