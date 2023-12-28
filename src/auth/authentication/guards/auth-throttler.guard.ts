import {
  ThrottlerException,
  ThrottlerGuard,
  ThrottlerModuleOptions,
} from '@nestjs/throttler'

export class AuthThrottlerGuard extends ThrottlerGuard {
  protected options: ThrottlerModuleOptions = {
    throttlers: [{ ttl: 1000 * 30, limit: 3 }],
  }

  protected throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(
      'Demasiados intentos, prueba de nuevo en unos segundos',
    )
  }
}
