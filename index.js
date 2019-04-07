const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const isNumber = /^-?([1-9][0-9]*|0)$/
const booleans = ['true', 'false']

const invalidValue = (key, val) =>
  new Error(`Invalid config value for "${key}": ${val}`)

const parse = (key, val, attrs) => {
  const { type, required } = attrs

  if (required === true) {
    if (typeof val !== 'string') throw invalidValue(key, val)
    if (val === '') throw invalidValue(key, val)
    return val
  } else {
    if (val === undefined || val === '') {
      if (typeof attrs.default === 'function') return attrs.default()
      return attrs.default
    }
    if (typeof val !== 'string') throw invalidValue(key, val)
  }

  if (type === 'string') return val

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

  Object.entries(schema).forEach(([key, attrs]) => {
    if (typeof attrs === 'string') attrs = { type: attrs }

    config[key] = parse(key, given[key], attrs)
  })

  return config
}
