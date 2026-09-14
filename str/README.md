# @pulgasari/str

string case transforms and a dual-use `str()` helper.

## install

```sh
deno add jsr:@pulgasari/str   # deno
npx jsr add @pulgasari/str    # npm / node / bun
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
