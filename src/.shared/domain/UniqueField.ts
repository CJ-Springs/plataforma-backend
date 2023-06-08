import { Identifier } from './Identifier'

export class UniqueField extends Identifier<string> {
  constructor(value: string) {
    super(value)
  }
}
