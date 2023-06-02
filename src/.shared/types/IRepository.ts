import { AggregateRoot } from '@nestjs/cqrs'

import { Result } from './../helpers/Result'

export interface IRepository<T extends AggregateRoot, P> {
  findOneById(id: string): Promise<Result<T> | null>
  add(data: P): Promise<void>
  update(data: Partial<P>): Promise<void>
}

export interface IFindByUniqueInput<T extends AggregateRoot> {
  findOneByUniqueInput(where: Record<string, any>): Promise<Result<T> | null>
}
