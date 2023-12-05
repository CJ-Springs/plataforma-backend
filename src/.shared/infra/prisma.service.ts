import { Injectable, INestApplication, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect()

    this.$use(async (params, next) => {
      const { action, model } = params
      const isDeleteUser = action === 'delete' && model === 'User'

      if (isDeleteUser) {
        params.action = 'update'

        const data = {
          deleted: true,
          deletedAt: new Date(),
        }

        if (params.args.data != undefined) {
          params.args.data = data
        } else {
          params.args['data'] = data
        }
      }

      return next(params)
    })
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close()
    })
  }
}
