import { TechnicalSheetType } from '@prisma/client'

type AttachTechnicalSheetCommandProps = {
  code: string
  type: TechnicalSheetType
  weight: number
  height: number
  wireThickness: number
  amountOfLaps: number
  lightBetweenBases: number
  innerCore: number
  lightBetweenBasesTwo?: number
  innerBases?: number
  innerBasesTwo?: number
}

export class AttachTechnicalSheetCommand {
  constructor(public readonly data: AttachTechnicalSheetCommandProps) {}
}