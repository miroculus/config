# @miroculus/config

Configure your node apps in a clear, easy and type safe way. Just define the configuration
values with the types you want to have, and set them using environment variables or
setting them on an `.env` file.

## Getting Started

Install it:

```bash
npm install @miroculus/config
```

Somewhere on your project, create a file where you define and load your configuration
values, for example on `src/config.js`:

```javascript
const loadConfig = require('@miroculus/config')

module.exports = loadConfig({
  PORT: { type: 'number', default: 3000 },
  TLS_ENABLED: 'boolean',
  MONGODB_URI: { type: 'string', default: 'mongodb://localhost/database' },
  PASSWORD_SALT: { type: 'string', required: true },
  AUTH: { type: 'json', default: () => ({ user: 'admin', password: 'admin' }) }
})
```

Then, you can set you configs using environment variables, or creating a file on the
root of you project named `.env` (Thanks [`dotenv`](https://www.npmjs.com/package/dotenv)):

```bash
PORT=8080
TLS_ENABLED=true
MONGODB_URI=mongodb://localhost/myCustomName
PASSWORD_SALT=somethingreallylongplease
AUTH={ "user": "admin", "password": "some-complicated-password" }
```

Then, just use it:

```javascript
const config = require('./src/config')

config.PORT === 8080 // true
!!config.TLS_ENABLED // true

config.MONGODB_URI === 'mongodb://localhost/myCustomName' // true

config.AUTH.user === 'admin' // true
config.AUTH.password === 'some-complicated-password' // true
```

## Config Schema Definition

For each configuration value you can define it's `type`, if it is `required`, or if
it has a `default` value. This are all the possible options:

### **`Schema.type`**

* **`string`**
  * All string values will be parsed as is.
  * The value will be trimmed
    * e.g.: `BAR= value foo ` => `config.BAR === 'value foo'`
* `number`
  * Number values will be coerced to `Number`
    * e.g.: `PORT=3000` => `config.PORT === 3000`
  * Only Integer values are allowed (If you set `NUMBER=3.2` it will throw an error)
  * Negative numbers are allowed, e.g.: `NUMBER=-32`
  * Numbers must be "well written", e.g.:
    * `0` ✅
    * `00` ❌
    * `0123` ❌
    * `12300` ✅
    * `-123` ✅
    * `-0` ✅
* `boolean`
  * Can be setted using the words `true` or `false`
  * Can have uppercase letters, e.g.: `True` or `TRUE`
  * When a boolean is not setted and is not `required`, its value will be `undefined`, unless it has a `default` value.
* `json`
  * Json values will be parsed using `JSON.parse`
  * Examples:
    * `VAL={"some": "json-value"}`
    * `VAL=["an", "array", "of", "strings"]`
    * `VAL={}`
    * `VAL=[]`
* `array`
  * Array values are a custom type for defining an array of `string`s.
  * Is the same as defining `type: 'string'` but the value will be splitted and trimmed using `val.split(',').map((str) => str.trim())`
  * For exmple `VAL=a, b, c` will be parsed to `config.VAL = ['a', 'b', 'c']`

### **`Schema.default`**

The default config is to set a value when something is not configured, it
can take any value to set, or a function that will be executed and the result setted. e.g.:
  * `PORT: { type: 'number', default: 3000 }`
  * `PORT: { type: 'number', default: () => randomNumberBetween(3000, 8000) }`

### **`Schema.required`**

You can set your value as `required: true` if you want to throw an error when a
value is not setted, or its setted to an empty value.

### **`Schema.validate`**

This props serves to add a custom validation for the given value. It can be a function
that should return `true` or `false`, or a `RegExp`. e.g. both of the following validations
check that the configured value is `1`, `2` or `3`:

```javascript
module.exports = loadConfig({
  STRING_VALIDATE: { type: 'number', validate: (val, key, config) => [1, 2, 3].includes(val)},
  REGEXP_VALIDATE: { type: 'number', validate: /^(1|2|3)$/ }
})
```

### **`Schema.enum`**

The enum property allows you to set a finite set of value that the given configuration can have. e.g.:

```javascript
module.exports = loadConfig({
  LOG_LEVEL: { type: 'string', enum: ['debug', 'info', 'warn', 'error'] }
})
```

## Test

```bash
npm run test
```

```bash
npm run test:watch # for development purposes
```

## License
`MIT`
