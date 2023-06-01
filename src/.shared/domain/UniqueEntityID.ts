import * as cuid from 'cuid'

import { Identifier } from './Identifier'

export class UniqueEntityID extends Identifier<string | number> {
  constructor(id?: string | number | null) {
    super(id ? id : cuid())
  }
}
