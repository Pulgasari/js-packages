# @pulgasari/str

string case transforms and a dual-use `str()` helper.

## cdn

```javascript
import str from 'https://esm.sh/jsr/@pulgasari/str';
```
```javascript
import str from 'https://esm.sh/jsr/@pulgasari/str@1.0.0';
```

## install

```sh
deno add jsr:@pulgasari/str
```
```sh
pnpm add jsr:@pulgasari/str
```
```sh
yarn add jsr:@pulgasari/str
```
```sh
npx jsr add @pulgasari/str
```

## usage

```js
import str, { toKebabCase, capitalize, unquote } from '@pulgasari/str';

// standalone transforms
toKebabCase('userProfileStatus'); // 'user-profile-status'
capitalize('foo');                // 'Foo'

// static form
str.toSlugCase('Héllo Wörld!');   // 'hello-world'

// chainable form: methods run against the wrapped string,
// unknown members fall through to native String methods
str('  Hi  ').trim();             // 'Hi'
str('abc').toUpperCase();         // 'ABC'
```

transforms: `capitalize`, `toLowerCase`, `toUpperCase`, `toCamelCase`,
`toConstantCase`, `toKebabCase`, `toPascalCase`, `toSlugCase`, `toSnakeCase`,
`toTitleCase`, `trim`, `trimEnd`, `trimStart`, `unquote`, plus variadic
`startsWith` / `endsWith`.

all transforms coerce nullish input to `''`.
