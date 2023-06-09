import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'

import { User } from '../../aggregate/user.aggregate'
import { UserRepository } from '../../repository/user.repository'
import { CreateUserCommand } from '../impl/create-user.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { Result, Validate } from '@/.shared/helpers'

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: CreateUserCommand) {
    this.logger.log('Ejecutando el CreateUser command handler')

    const validateCommand = this.validate(command)

    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command
    const { document, email, firstname, lastname, phone } = data

    const existUser = await this.prisma.user.findUnique({
      where: { email },
    })
    if (existUser) {
      throw new ConflictException(`Ya existe un usuario con el email ${email}`)
    }

    if (data?.role) {
      const existRole = await this.prisma.role.findUnique({
        where: { role: data.role },
      })
      if (!existRole) {
        throw new NotFoundException(`El rol ${data.role} no ha sido creado`)
      }
    }

    const password = `${document}${firstname[0].toUpperCase()}${lastname[0].toLowerCase()}`

    const userOrError = User.create({
      email,
      isSuspended: false,
      role: data?.role ?? 'USER',
      password,
      profile: {
        firstname,
        lastname,
        phone,
        document,
      },
    })

    if (userOrError.isFailure) {
      throw new BadRequestException(userOrError.getErrorValue())
    }

    const user = userOrError.getValue()

    await this.userRepository.save(user)

    this.publisher.mergeObjectContext(user).commit()

    return {
      success: true,
      statusCode: 201,
      message: 'Usuario creado correctamente',
      data: user.toDTO(),
    }
  }

  validate(command: CreateUserCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.email, argumentName: '.email' },
      { argument: command.data.firstname, argumentName: 'firstname' },
      { argument: command.data.lastname, argumentName: 'lastname' },
      { argument: command.data.phone, argumentName: 'phone' },
      { argument: command.data.document, argumentName: 'document' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
