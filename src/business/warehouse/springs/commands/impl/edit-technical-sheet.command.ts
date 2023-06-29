import { TechnicalSheetType } from '@prisma/client'

type EditTechnicalSheetCommandProps = {
  code: string
  type: TechnicalSheetType
  weight?: number
  height?: number
  wireThickness?: number
  amountOfLaps?: number
  lightBetweenBases?: number
  innerCore?: number
  lightBetweenBasesTwo?: number
  innerBases?: number
  innerBasesTwo?: number
}

export class EditTechnicalSheetCommand {
  constructor(public readonly data: EditTechnicalSheetCommandProps) {}
}
