const { deepStrictEqual, throws } = require('assert')
const { describe, it } = require('mocha')
const loadConfig = require('..')

describe('load config from an object', () => {
  const testCases = [
    {
      desc: 'parse types',
      schema: {
        STRING: 'string',
        NUMBER: 'number',
        BOOLEAN: 'boolean',
        JSON: 'json'
      },
      given: {
        STRING: 'test string',
        NUMBER: '232',
        BOOLEAN: 'true',
        JSON: '{"some":"json-value"}'
      },
      expected: {
        STRING: 'test string',
        NUMBER: 232,
        BOOLEAN: true,
        JSON: { some: 'json-value' }
      }
    },
    {
      desc: 'parse empty value as undefined',
      schema: { STRING: 'string' },
      given: {},
      expected: { STRING: undefined }
    },
    {
      desc: 'parse empty string value as undefined',
      schema: { STRING: 'string' },
      given: { STRING: '' },
      expected: { STRING: undefined }
    },
    {
      desc: 'parse required value',
      schema: { STRING: { type: 'string', required: true } },
      given: { STRING: 'the-value' },
      expected: { STRING: 'the-value' }
    },
    {
      desc: 'parse a "null" json as `null`',
      schema: { VAL: 'json' },
      given: { VAL: 'null' },
      expected: { VAL: null }
    },
    {
      desc: 'parse a json array',
      schema: { VAL: 'json' },
      given: { VAL: '[1,2,3]' },
      expected: { VAL: [1, 2, 3] }
    },
    {
      desc: 'parse an uppercase boolean',
      schema: { VAL: 'boolean' },
      given: { VAL: 'TRUE' },
      expected: { VAL: true }
    },
    {
      desc: 'return a default value',
      schema: { VAL: { type: 'string', default: 'default-value' } },
      given: { VAL: '' },
      expected: { VAL: 'default-value' }
    },
    {
      desc: 'return a default value from a function',
      schema: { VAL: { type: 'string', default: () => 'default-value' } },
      given: { VAL: '' },
      expected: { VAL: 'default-value' }
    },
    {
      desc: 'throw on missing required value',
      schema: { STRING: { type: 'string', required: true } },
      given: {},
      expected: Error
    },
    {
      desc: 'throw when giving invalid number',
      schema: { VAL: 'number' },
      given: { VAL: 'another' },
      expected: Error
    }
  ]

  testCases.forEach(({ desc, schema, given, expected }, i) => {
    it(desc, () => {
      const load = () =>
        loadConfig(schema, {
          fromEnvFile: false,
          fromProcessEnv: false,
          envObject: given
        })

      if (expected === Error) {
        throws(load)
      } else {
        const result = load()
        deepStrictEqual(result, expected)
      }
    })
  })
})
