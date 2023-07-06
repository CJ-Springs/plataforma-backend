import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { PricingService } from './pricing.service'
import {
  IncreaseBulkPricesDto,
  IncreasePriceDto,
  ManuallyUpdatePriceDto,
} from './dtos'
import { IncreasePriceCommand } from './commands/impl/increase-price.command'
import { ManuallyUpdatePriceCommand } from './commands/impl/manually-update-price.command'
import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'

@Controller('ventas/precios')
export class PricingController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly pricingService: PricingService,
  ) {}

  @RequiredPermissions('backoffice::aumentar-precios')
  @UseGuards(PermissionGuard)
  @Patch('aumentar-precios')
  async increaseBulkPrice(@Body() data: IncreaseBulkPricesDto) {
    return await this.pricingService.increaseBulkPrices(data)
  }

  @RequiredPermissions('backoffice::aumentar-precios')
  @UseGuards(PermissionGuard)
  @Patch('aumentar-precios/:code')
  async increaseSinglePrice(
    @Param('code') code: string,
    @Body() data: IncreasePriceDto,
  ) {
    return await this.commandBus.execute(
      new IncreasePriceCommand({
        code,
        ...data,
      }),
    )
  }

  @RequiredPermissions('backoffice::actualizar-precio-manualmente')
  @UseGuards(PermissionGuard)
  @Patch('actualizar-precio/:code')
  async manuallyUpdatePrice(
    @Param('code') code: string,
    @Body() data: ManuallyUpdatePriceDto,
  ) {
    return await this.commandBus.execute(
      new ManuallyUpdatePriceCommand({
        code,
        ...data,
      }),
    )
  }
}
