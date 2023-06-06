import { Injectable } from '@nestjs/common'
import { ICommand, Saga, ofType } from '@nestjs/cqrs'
import { Observable, map } from 'rxjs'

import { PermissionCreatedEvent } from '../events/impl/PermissionCreated.event'
import { AssignPermissionToRoleCommand } from '../commands/impl/assign-permission-to-role'

@Injectable()
export class RoleSagas {
  @Saga()
  permissionCreated = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(PermissionCreatedEvent),
      map((event) => {
        const { data } = event

        if (data.roles) {
          return new AssignPermissionToRoleCommand({
            roles: data.roles,
            permission: data.name,
          })
        }
      }),
    )
  }
}
