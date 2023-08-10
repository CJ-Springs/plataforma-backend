type MakeCreditNoteCommandProps = {
  customerCode: number
  createdBy: string
  observation?: string
  items: {
    productCode: string
    returned: number
    price?: number
  }[]
}

export class MakeCreditNoteCommand {
  constructor(public readonly data: MakeCreditNoteCommandProps) {}
}
