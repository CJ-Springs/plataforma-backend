import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import {
  AttachTechnicalSheetDto,
  EditTechnicalSheetDto,
  StockAdjustmentDto,
} from './dtos'
import { AttachTechnicalSheetCommand } from './commands/impl/attach-technical-sheet.command'
import { EditTechnicalSheetCommand } from './commands/impl/edit-technical-sheet.command'
import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'
import { StockAdjustmentCommand } from './commands/impl/stock-adjustment.command'

@Controller('espirales')
export class SpringsController {
  constructor(private readonly commandBus: CommandBus) {}

  @RequiredPermissions('backoffice::adjuntar-ficha-tecnica')
  @UseGuards(PermissionGuard)
  @Post(':code/ficha-tecnica')
  async attachTechnicalSheet(
    @Param('code') code: string,
    @Body() technicalSheet: AttachTechnicalSheetDto,
  ) {
    return await this.commandBus.execute(
      new AttachTechnicalSheetCommand({
        ...technicalSheet,
        code,
      }),
    )
  }

  @RequiredPermissions('backoffice::editar-ficha-tecnica')
  @UseGuards(PermissionGuard)
  @Patch(':code/ficha-tecnica')
  async editTechnicalSheet(
    @Param('code') code: string,
    @Body() technicalSheet: EditTechnicalSheetDto,
  ) {
    return await this.commandBus.execute(
      new EditTechnicalSheetCommand({ ...technicalSheet, code }),
    )
  }

  @RequiredPermissions('backoffice::ajuste-stock')
  @UseGuards(PermissionGuard)
  @Patch(':code/stock/ajuste-stock')
  async stockAdjustment(
    @Param('code') code: string,
    @Body() adjustment: StockAdjustmentDto,
  ) {
    return await this.commandBus.execute(
      new StockAdjustmentCommand({
        code,
        ...adjustment,
      }),
    )
  }
}
