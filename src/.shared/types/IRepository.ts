import { AggregateRoot } from '@nestjs/cqrs'

import { Result } from './../helpers/Result'

export interface IRepository<T extends AggregateRoot, P> {
  findOneById(id: string): Promise<Result<T>>
  findOneByUniqueInput(where: Record<string, any>): Promise<Result<T>>
  save(data: Partial<P>): Promise<Result<T>>
}
