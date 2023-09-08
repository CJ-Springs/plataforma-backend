import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { MakeCreditNoteDto } from './dtos'
import { MakeCreditNoteCommand } from './commands/impl/make-credit-note.command'
import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'
import { UserDec } from '@/.shared/decorators'

@Controller('clientes/:customerCode/notas-credito')
export class CreditNotesController {
  constructor(private readonly commandBus: CommandBus) {}

  @RequiredPermissions('backoffice::hacer-nota-credito')
  @UseGuards(PermissionGuard)
  @Post('nueva-nota-credito')
  async makeCreditNote(
    @Param('customerCode', ParseIntPipe) customerCode: number,
    @Body() creditNote: MakeCreditNoteDto,
    @UserDec('email') email: string,
  ) {
    return await this.commandBus.execute(
      new MakeCreditNoteCommand({
        ...creditNote,
        customerCode,
        createdBy: email,
      }),
    )
  }
}
