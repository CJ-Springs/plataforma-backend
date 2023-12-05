import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { CreditNotesController } from './credit-notes.controller'
import { CreditNoteRepository } from './repository/credit-note.repository'
import { CommandHandlers } from './commands/handlers'
import { RolesModule } from '@/auth/authorization/roles/roles.module'

@Module({
  imports: [CqrsModule, RolesModule],
  controllers: [CreditNotesController],
  providers: [CreditNoteRepository, ...CommandHandlers],
})
export class CreditNotesModule {}
