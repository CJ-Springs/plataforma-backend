import { SetMetadata } from '@nestjs/common'
import { getUniqueValues } from '@/.shared/utils'

export const PERMISSIONS_KEY = 'REQUIRED_PERMISSIONS'
export const RequiredPermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, getUniqueValues(permissions))
