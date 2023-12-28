import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common'

import { AuthenticationService } from './authentication.service'
import { LoginDto, StepOneDto, StepThreeDto, StepTwoDto } from './dtos'
import { Public } from './guards/is-public.decorator'
import { AuthThrottlerGuard } from './guards/auth-throttler.guard'

@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() credentials: LoginDto) {
    return await this.authenticationService.login(credentials)
  }

  @Public()
  @UseGuards(AuthThrottlerGuard)
  @Post('cambiar-password/paso-1')
  @HttpCode(HttpStatus.OK)
  async generateRecoveryCode(@Body() data: StepOneDto) {
    return await this.authenticationService.generateRecoveryCode(data)
  }

  @Public()
  @UseGuards(AuthThrottlerGuard)
  @Post('cambiar-password/paso-2')
  @HttpCode(HttpStatus.OK)
  async validateCode(@Body() data: StepTwoDto) {
    return await this.authenticationService.validateCode(data)
  }

  @Public()
  @UseGuards(AuthThrottlerGuard)
  @Post('cambiar-password/paso-3')
  @HttpCode(HttpStatus.OK)
  async useRecoveryCode(@Body() data: StepThreeDto) {
    return await this.authenticationService.useRecoveryCode(data)
  }
}
