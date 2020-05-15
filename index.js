const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const isNumber = /^-?([1-9][0-9]*|0)$/
const booleans = ['true', 'false']

const hasOwnProperty = (obj, key) =>
  Object.prototype.hasOwnProperty.call(obj, key)

// These are the symbols used by node's inspect and assertions,
// which should not be included when checking if an object has it as property.
// More info: https://stackoverflow.com/questions/6511542/force-javascript-exception-error-when-reading-an-undefined-object-property#comment85913679_45322399
const reservedSymbols = [
  'toJSON',
  'valueOf',
  'inspect',
  Symbol.for('nodejs.util.inspect.custom'),
  Symbol.isConcatSpreadable,
  Symbol.toStringTag,
  Symbol.iterator
]

const invalidValue = (key, val) =>
  new Error(`Invalid config value for "${key}": ${val}`)

const parse = (key, val, schema) => {
  const { type, required } = schema

  if (required === true) {
    if (typeof val !== 'string') throw invalidValue(key, val)
    if (val === '') throw invalidValue(key, val)
    return val
  } else {
    if (val === undefined || val === '') {
      if (typeof schema.default === 'function') return schema.default()
      if (type === 'array') return []
      return schema.default
    }
    if (typeof val !== 'string') throw invalidValue(key, val)
  }

  if (type === 'string') return val

  if (type === 'array') return val.split(',').map(str => str.trim())

  if (type === 'number') {
    const n = Number(val)
    if (!isNumber.test(n)) throw invalidValue(key, val)
    return n
  }

  if (type === 'boolean') {
    const b = val.toLowerCase()
    if (!booleans.includes(b)) throw invalidValue(key, val)
    return b === 'true'
  }

  if (type === 'json') return JSON.parse(val)

  throw new Error(`Invalid type "${type}" for "${key}" config`)
}

module.exports = (schema = {}, opts = {}) => {
  const { fromEnvFile = true, fromProcessEnv = true, envObject = {} } = opts

  const config = {}

  const given = { ...envObject }

  if (fromEnvFile) {
    const dotenvPath =
      fromEnvFile === true ? path.resolve(process.cwd(), '.env') : fromEnvFile

    if (fs.existsSync(dotenvPath)) {
      const parsed = dotenv.parse(fs.readFileSync(dotenvPath))
      Object.assign(given, parsed)
    }
  }

  if (fromProcessEnv) {
    Object.assign(given, process.env)
  }

  const validationsToRun = []

  Object.entries(schema).forEach(([key, schema]) => {
    if (typeof schema === 'string') schema = { type: schema }

    const val = parse(key, given[key], schema)

    if (schema.validate) {
      // Run validations after all values has been parsed so we can validate some
      // values depending another one.
      validationsToRun.push(() => {
        if (typeof schema.validate === 'function') {
          if (!schema.validate(val, key, config)) {
            throw new Error(
              `Value for ${key} configuration does not pass custom validation`
            )
          }
        } else if (schema.validate instanceof RegExp) {
          if (!schema.validate.test(val)) {
            throw new Error(
              `Value for ${key} does not validate format of regex "${schema.validate}"`
            )
          }
        } else {
          throw new Error(`Invalid validate value for ${key} configuration`)
        }
      })
    }

    if (schema.enum) {
      if (!Array.isArray(schema.enum)) {
        throw new Error(
          `Invalid enum value for ${key} configuration: ${schema.enum}`
        )
      }

      if (!schema.enum.includes(val)) {
        throw new Error(
          `Value for ${key} should be one of: ${schema.enum.join(', ')}`
        )
      }
    }

    config[key] = val
  })

  validationsToRun.forEach(validate => validate())

  // This Proxy throws an error if trying to access a not configured value.
  return new Proxy(config, {
    get (target, prop) {
      if (
        !reservedSymbols.includes(prop) &&
        !hasOwnProperty(target, prop)
      ) {
        throw new Error(`Invalid config key "${prop}"`)
      }

      return target[prop]
    },

    set (target, prop, value) {
      if (!hasOwnProperty(target, prop)) {
        throw new Error(`Invalid config key "${prop}"`)
      }

      return target[prop] = value
    }
  })
}
