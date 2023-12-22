import {
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { FileInterceptor } from '@nestjs/platform-express'

import { AddProductDto, UpdateProductDto } from './dtos'
import { AddProductCommand } from './commands/impl/add-product.command'
import { UpdateProductCommand } from './commands/impl/update-product.command'
import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'
import { ProductsService } from './products.service'

@Controller('productos')
export class ProductsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly productsService: ProductsService,
  ) {}

  @RequiredPermissions('backoffice::registrar-productos-en-masa')
  @UseGuards(PermissionGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Post('registrar-productos')
  async registerBulkProducts(
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
    @Body('fathers') fathers?: string,
  ) {
    const products = this.productsService.parseProductsFromCSVFile(
      file.buffer,
      !!fathers,
    )

    return await this.productsService.registerBulkProducts(products, !!fathers)
  }

  @RequiredPermissions('backoffice::añadir-producto')
  @UseGuards(PermissionGuard)
  @Post()
  async addProduct(@Body() newProduct: AddProductDto) {
    return await this.commandBus.execute(new AddProductCommand(newProduct))
  }

  @RequiredPermissions('backoffice::actualizar-producto')
  @UseGuards(PermissionGuard)
  @Patch(':productCode')
  async updateProduct(
    @Param('productCode') productCode: string,
    @Body() data: UpdateProductDto,
  ) {
    return await this.commandBus.execute(
      new UpdateProductCommand({ ...data, code: productCode }),
    )
  }
}
