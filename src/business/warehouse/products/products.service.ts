import { BadRequestException, Injectable } from '@nestjs/common'
import * as Papa from 'papaparse'

type Types = 'string' | 'number' | 'boolean'

const productFields: { key: string; type: Types }[] = [
  {
    key: 'code',
    type: 'string',
  },
  {
    key: 'brand',
    type: 'string',
  },
  {
    key: 'model',
    type: 'string',
  },
  {
    key: 'description',
    type: 'string',
  },
  {
    key: 'position',
    type: 'string',
  },
  {
    key: 'type',
    type: 'string',
  },
  {
    key: 'isGnc',
    type: 'boolean',
  },
  {
    key: 'price',
    type: 'number',
  },
]

const fathersFields: typeof productFields = [
  ...productFields,
  {
    key: 'canAssociate',
    type: 'boolean',
  },
  {
    key: 'minQuantity',
    type: 'number',
  },
  {
    key: 'quantityOnHand',
    type: 'number',
  },
]

const associatedFields: typeof productFields = [
  ...productFields,
  {
    key: 'springCode',
    type: 'string',
  },
]

@Injectable()
export class ProductsService {
  async parseProductsFromCSVFile(file: Buffer, fathers: boolean) {
    const { data } = Papa.parse(file.toString())
    const [keys, ...products] = data as Array<string[]>

    const requiredFields = fathers ? fathersFields : associatedFields

    const allKeysMustBeIncluded = requiredFields
      .map((field) => field.key)
      .every((key) => keys.includes(key))

    if (!allKeysMustBeIncluded) {
      throw new BadRequestException('Faltan campos en el archivo de productos')
    }

    const parseProducts = products.reduce((acc, csvValues) => {
      const product = csvValues.reduce<any>((acc, value, i) => {
        let actualValue: any = value
        const field = requiredFields.find(
          (requiredField) => requiredField.key === keys[i],
        )

        if (value === '' && field.type !== 'boolean') actualValue = null
        else if (field.type === 'number') actualValue = Number(value)
        else if (field.type === 'boolean') actualValue = Boolean(value)

        return { ...acc, [field.key]: actualValue }
      }, {})

      acc.push(product)

      return acc
    }, [])

    return parseProducts
  }
}
