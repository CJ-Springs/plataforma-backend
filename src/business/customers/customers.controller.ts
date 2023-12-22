import {
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { FileInterceptor } from '@nestjs/platform-express'

import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'
import { RegisterCustomerDto, UpdateCustomerDto } from './dtos'
import { RegisterCustomerCommand } from './commands/impl/register-customer.command'
import { UpdateCustomerCommand } from './commands/impl/update-customer.command'
import { CustomersService } from './customers.service'

@Controller('clientes')
export class CustomersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly customersService: CustomersService,
  ) {}

  @RequiredPermissions('backoffice::registrar-clientes-en-masa')
  @UseGuards(PermissionGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Post('registrar-clientes')
  async registerBulkCustomers(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new FileTypeValidator({ fileType: 'text/csv' }),
          new MaxFileSizeValidator({
            maxSize: 500_000, // 500KB
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const customers = this.customersService.parseCustomersFromCSVFile(
      file.buffer,
    )

    return await this.customersService.registerBulkCustomers(customers)
  }

  @RequiredPermissions('backoffice::registrar-cliente')
  @UseGuards(PermissionGuard)
  @Post()
  async registerCustomer(@Body() newCustomer: RegisterCustomerDto) {
    return await this.commandBus.execute(
      new RegisterCustomerCommand(newCustomer),
    )
  }

  @RequiredPermissions('backoffice::actualizar-cliente')
  @UseGuards(PermissionGuard)
  @Patch(':code')
  async updateCustomer(
    @Param('code', ParseIntPipe) code: number,
    @Body() data: UpdateCustomerDto,
  ) {
    return await this.commandBus.execute(
      new UpdateCustomerCommand({ code, ...data }),
    )
  }
}
