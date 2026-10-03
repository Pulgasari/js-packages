// @pulgasari/typeshift/parse.js

/*
a pattern string -> a syntax tree. the grammar, loosest first:

union        intersection ('|' intersection)*
intersection unary ('&' unary)*
unary        '!' unary | postfix
postfix      primary '[]'*                      every item matches
primary      '(' union ')' | tuple | shape | literal | regexp | name range?
tuple        '[' (union (',' union)*)? (',' '...' union)? ']'
shape        '{' (key '?'? ':' union (',' …)*)? ','? '}'
range        '(' number? '..' number? ')' | '(' number ')'
literal      'text' | "text" | number | true | false | null | undefined
regexp       /source/flags

'string | number'   '[number, number, number]'   'number(0..10)'
'{ ok: true, data?: object }'   'string[]'   '!nullish'   '/^\d+$/'
*/

// :::::: TOKENS

const PUNCTUATION = new Set(['!', '&', '(', ')', ',', ':', '?', '[', ']', '{', '|', '}']);

function tokenize (source) {
  const tokens = [];
  let index = 0;

  const fail = message => { throw new SyntaxError(`${message} at ${index} in "${source}"`); };

  while (index < source.length) {
    const char = source[index];

    if (/\s/.test(char)) { index++; continue; }

    if (source.startsWith('...', index)) { tokens.push({ at: index, type: '...' }); index += 3; continue; }
    if (source.startsWith('..', index))  { tokens.push({ at: index, type: '..' });  index += 2; continue; }

    if (PUNCTUATION.has(char)) { tokens.push({ at: index, type: char }); index++; continue; }

    if (char === '"' || char === "'") {
      const end = source.indexOf(char, index + 1);
      if (end < 0) fail('unclosed string');
      tokens.push({ at: index, type: 'literal', value: source.slice(index + 1, end) });
      index = end + 1;
      continue;
    }

    // a regexp is only where a value may start, after an operator or at the beginning
    if (char === '/' && (!tokens.length || PUNCTUATION.has(tokens.at(-1).type))) {
      let end = index + 1;
      while (end < source.length && source[end] !== '/') end += source[end] === '\\' ? 2 : 1;
      if (end >= source.length) fail('unclosed regexp');
      const flags = source.slice(end + 1).match(/^[a-z]*/)[0];
      tokens.push({ at: index, type: 'regexp', value: new RegExp(source.slice(index + 1, end), flags) });
      index = end + 1 + flags.length;
      continue;
    }

    // never takes a trailing dot, `0..10` stays number, range, number
    const number = source.slice(index).match(/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/i);
    if (number) { tokens.push({ at: index, type: 'number', value: Number(number[0]) }); index += number[0].length; continue; }

    const name = source.slice(index).match(/^[A-Za-z_$][\w$]*/);
    if (name) { tokens.push({ at: index, type: 'name', value: name[0] }); index += name[0].length; continue; }

    fail(`unexpected "${char}"`);
  }

  tokens.push({ at: index, type: 'end' });
  return tokens;
}

// :::::: PARSER

const LITERALS = { false: false, null: null, true: true, undefined: undefined };

function parse (source) {
  let position = 0;
  
  const tokens = tokenize(source);
  const peek   = ()      => tokens[position];
  const next   = ()      => tokens[position++];
  const accept = type    => peek().type === type ? next() : null;
  const fail   = message => { throw new SyntaxError(`${message} at ${peek().at} in "${source}"`); };
  const expect = type    => accept(type) ?? fail(`expected "${type}"`);

  function union () {
    const options = [intersection()];
    while (accept('|')) options.push(intersection());
    return options.length > 1 ? { options, type: 'union' } : options[0];
  }

  function intersection () {
    const parts = [unary()];
    while (accept('&')) parts.push(unary());
    return parts.length > 1 ? { parts, type: 'intersection' } : parts[0];
  }

  function unary () {
    if (accept('!')) return { pattern: unary(), type: 'not' };
    let node = primary();
    while (peek().type === '[' && tokens[position + 1]?.type === ']') { position += 2; node = { item: node, type: 'list' }; }
    return node;
  }

  function range () {
    const minimum = accept('number')?.value;
    if (!accept('..')) {
      if (minimum === undefined) fail('expected a number or ".."');
      return { maximum: minimum, minimum };
    }
    return { maximum: accept('number')?.value, minimum };
  }

  function primary () {
    const token = peek();

    if (accept('(')) { const node = union(); expect(')'); return node; }

    if (accept('[')) {
      const items = [];
      let rest = null;
      while (peek().type !== ']') {
        if (accept('...')) { rest = union(); accept(','); break; }
        items.push(union());
        if (!accept(',')) break;
      }
      expect(']');
      return { items, rest, type: 'tuple' };
    }

    if (accept('{')) {
      const fields = [];
      while (peek().type !== '}') {
        const key      = accept('name') ?? accept('literal') ?? fail('expected a key');
        const optional = Boolean(accept('?'));
        expect(':');
        fields.push({ key: String(key.value), optional, pattern: union() });
        if (!accept(',')) break;
      }
      expect('}');
      return { fields, type: 'shape' };
    }

    if (token.type === 'literal' || token.type === 'number') { next(); return { type: 'literal', value: token.value }; }
    if (token.type === 'regexp') { next(); return { type: 'regexp', value: token.value }; }

    if (token.type === 'name') {
      next();
      if (Object.hasOwn(LITERALS, token.value)) return { type: 'literal', value: LITERALS[token.value] };
      if (accept('(')) { const bounds = range(); expect(')'); return { name: token.value, range: bounds, type: 'name' }; }
      return { name: token.value, type: 'name' };
    }

    fail(token.type === 'end' ? 'unexpected end' : `unexpected "${token.type}"`);
  }

  const tree = union();
  if (peek().type !== 'end') fail(`unexpected "${peek().type}"`);
  return tree;
}

export { parse, tokenize };
export default parse;
