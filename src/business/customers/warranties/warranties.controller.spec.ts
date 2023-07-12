import { Test, TestingModule } from '@nestjs/testing'
import { WarrantiesController } from './warranties.controller'

describe('WarrantiesController', () => {
  let controller: WarrantiesController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WarrantiesController],
    }).compile()

    controller = module.get<WarrantiesController>(WarrantiesController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
