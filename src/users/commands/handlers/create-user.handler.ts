import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'

import { User } from '../../aggregate/user.aggregate'
import { UserRepository } from '../../repository/user.repository'
import { CreateUserCommand } from '../impl/create-user.command'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { Result, Validate, LoggerService } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: CreateUserCommand): Promise<StandardResponse> {
    this.logger.log('Users', 'Ejecutando el CreateUser command handler', {
      logType: 'command-handler',
    })

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command
    const {
      email,
      profile: { document, firstname, lastname },
    } = data

    const existUser = await this.prisma.user.findUnique({
      where: { email },
    })
    if (existUser) {
      throw new ConflictException(`Ya existe un usuario con el email ${email}`)
    }

    for await (const role of data.roles) {
      await this.prisma.role
        .findUniqueOrThrow({ where: { code: role } })
        .catch(() => {
          throw new NotFoundException(`No se ha encontrado el rol ${role}`)
        })
    }

    const password = `${document}${firstname[0].toUpperCase()}${lastname[0].toLowerCase()}`

    const userOrError = User.create({
      ...data,
      isSuspended: false,
      deleted: false,
      roles: data.roles,
      password,
    })
    if (userOrError.isFailure) {
      throw new BadRequestException(userOrError.getErrorValue())
    }
    const user = userOrError.getValue()

    await this.userRepository.save(user)
    this.publisher.mergeObjectContext(user).commit()

    return {
      success: true,
      status: 201,
      message: `Usuario registrado con el email ${email}`,
      data: user.toDTO(),
    }
  }

  validate(command: CreateUserCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.email, argumentName: 'email' },
      { argument: command.data.roles, argumentName: 'roles' },
      { argument: command.data.profile, argumentName: 'profile' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
