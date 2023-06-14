import { AggregateRoot } from '@nestjs/cqrs'

import { Result } from './../helpers/Result'

export interface IRepository<T extends AggregateRoot> {
  findOneById(id: string): Promise<Result<T> | null>
  save(aggregate: T): Promise<void>
}

export interface IFindByUniqueInput<T extends AggregateRoot> {
  findOneByUniqueInput(where: Record<string, any>): Promise<Result<T> | null>
}
