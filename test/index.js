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
    },
    {
      desc: 'not setted nor required boolean should be undefined',
      schema: { VAL: 'boolean' },
      given: {},
      expected: { VAL: undefined }
    },
    {
      desc: 'boolean values not written as true should throw an error',
      schema: { VAL: 'boolean' },
      given: { VAL: 'truee' },
      expected: Error
    },
    {
      desc: 'boolean values not written as false should throw an error',
      schema: { VAL: 'boolean' },
      given: { VAL: 'fals' },
      expected: Error
    },
    {
      desc: 'boolean values can be written using uppercase',
      schema: { VAL: 'boolean' },
      given: { VAL: 'True' },
      expected: { VAL: true }
    },
    {
      desc: 'should pass with custom validation',
      schema: { VAL: { type: 'string', validate: () => true } },
      given: { VAL: 'str' },
      expected: { VAL: 'str' }
    },
    {
      desc: 'should throw with not passing custom validation',
      schema: { VAL: { type: 'string', validate: () => false } },
      given: { VAL: 'str' },
      expected: Error
    },
    {
      desc: 'should validate using a regex',
      schema: { VAL: { type: 'string', validate: /[a-z]+/ } },
      given: { VAL: 'abc' },
      expected: { VAL: 'abc' }
    },
    {
      desc: 'should throw an error with not passing regex validator',
      schema: { VAL: { type: 'string', validate: /[a-z]+/ } },
      given: { VAL: '123' },
      expected: Error
    },
    {
      desc: 'should validate the value is included in the given enum',
      schema: { VAL: { type: 'number', enum: [2, 4, 6] } },
      given: { VAL: '2' },
      expected: { VAL: 2 }
    },
    {
      desc: 'should allow to set a default when using enum',
      schema: { VAL: { type: 'string', default: 'a', enum: ['a', 'b', 'c'] } },
      given: { VAL: '' },
      expected: { VAL: 'a' }
    },
    {
      desc:
        'should throw an error if the value is not included in the given enum',
      schema: { VAL: { type: 'number', enum: [2, 4, 6] } },
      given: { VAL: '1' },
      expected: Error
    },
    {
      desc: 'should parse a custom array string',
      schema: { VAL: { type: 'array' } },
      given: {
        VAL: 'http://localhost:3000,http://localhost:3001,http://localhost:3002'
      },
      expected: {
        VAL: [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002'
        ]
      }
    },
    {
      desc: 'should parse a custom array and trim it',
      schema: { VAL: 'array' },
      given: { VAL: 'a, b, c' },
      expected: { VAL: ['a', 'b', 'c'] }
    },
    {
      desc: 'should parse a custom array with empty string as an empty array',
      schema: { VAL: 'array' },
      given: { VAL: '' },
      expected: { VAL: [] }
    },
    {
      desc: 'should parse an undefined array as an empty array',
      schema: { VAL: 'array' },
      given: {},
      expected: { VAL: [] }
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

  it('should allow to modify a config value', () => {
    const result = loadConfig(
      { VAL: 'string' },
      {
        fromEnvFile: false,
        fromProcessEnv: false,
        envObject: { VAL: 'the-val' }
      }
    )

    result.VAL = 'updated-value'

    deepStrictEqual(result.VAL, 'updated-value')
  })

  it('should throw an error when trying to get an unexistant config key', () => {
    const result = loadConfig(
      { VAL: 'string' },
      {
        fromEnvFile: false,
        fromProcessEnv: false,
        envObject: { VAL: 'the-val' }
      }
    )

    // Cannot get an unconfigured key
    throws(() => result.VLA)
  })

  it('should throw an error when trying to set an unexistant config key', () => {
    const result = loadConfig(
      { VAL: 'string' },
      {
        fromEnvFile: false,
        fromProcessEnv: false,
        envObject: { VAL: 'the-val' }
      }
    )

    throws(() => {
      result.NEW_VAL = 123
    })
  })
})
