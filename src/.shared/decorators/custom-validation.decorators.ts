import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator'

export function ShouldNotExistsIf(
  condition: (o: any) => boolean,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'shouldNotExistsIf',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [condition],
      options: validationOptions,
      validator: {
        validate(_value: any, args: ValidationArguments) {
          const [condition] = args.constraints
          if (!condition) {
            throw new Error(
              'BadImplemented: The ShouldNotExistsIf decorator must receive a function that returns a boolean as a first argument',
            )
          }

          return !(
            condition(args.object) && args.object[args.property] !== undefined
          )
        },
      },
    })
  }
}
