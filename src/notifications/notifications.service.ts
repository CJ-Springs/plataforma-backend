import { LoggerService } from '@/.shared/helpers'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Novu, ISubscriberPayload, ITriggerPayloadOptions } from '@novu/node'

import { NovuEvent } from './novu-events.types'

@Injectable()
export class NotificationsService implements OnModuleInit {
  private novu: Novu

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    this.connect()
  }

  private connect() {
    try {
      const NOVU_API_KEY = this.configService.getOrThrow('NOVU_API_KEY')
      this.novu = new Novu(NOVU_API_KEY)
      this.logger.log('Novu conectado correctamente', 'Novu service')
    } catch (error) {
      this.logger.error(
        'Missing NOVU_API_KEY. Please, set it in your env file',
        'Tratando de conectarse a Novu',
      )
    }
  }

  async addSubscriber(subscriberId: string, payload: ISubscriberPayload) {
    try {
      await this.novu.subscribers.identify(subscriberId, payload)
    } catch (error) {
      this.logger.error(error, 'Al agregar un nuevo subscriber a Novu')
    }
  }

  async removeSubscriber(subscriberId: string) {
    try {
      await this.novu.subscribers.delete(subscriberId)
    } catch (error) {
      this.logger.error(error, 'Al eliminar un subscriber de Novu')
    }
  }

  async trigger(event: NovuEvent, data: ITriggerPayloadOptions) {
    try {
      await this.novu.trigger(event, data)
    } catch (error) {
      this.logger.error(error, 'Al enviar una notificación Novu')
    }
  }
}
