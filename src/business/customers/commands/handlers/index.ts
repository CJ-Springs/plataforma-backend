import { ReduceBalanceHandler } from './reduce-balance.handler'
import { RegisterCustomerHandler } from './register-customer.handler'
import { UpdateCustomerHandler } from './update-customer.handler'

export const CommandHandlers = [
  RegisterCustomerHandler,
  UpdateCustomerHandler,
  ReduceBalanceHandler,
]
