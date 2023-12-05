import { Test, TestingModule } from '@nestjs/testing'
import { IncomeOrdersController } from './income-orders.controller'

describe('IncomeOrdersController', () => {
  let controller: IncomeOrdersController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncomeOrdersController],
    }).compile()

    controller = module.get<IncomeOrdersController>(IncomeOrdersController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
