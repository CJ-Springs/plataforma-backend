import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'

import { AuthenticationService } from './authentication.service'
import { LoginDto } from './dtos'
import { Public } from './guards/is-public.decorator'

@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() credentials: LoginDto) {
    return await this.authenticationService.login(credentials)
  }
}
