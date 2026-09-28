// @pulgasari/typeshift - type declarations

export type Predicate = (value: unknown) => boolean;
export type Handler<R> = R | ((target: any) => R);
export type Cases<R> = { [pattern: string]: Handler<R> } & { fallback?: Handler<R> };

export type Node =
  | { type: 'intersection'; parts: Node[] }
  | { type: 'list'; item: Node }
  | { type: 'literal'; value: string | number | boolean | null | undefined }
  | { type: 'name'; name: string; range?: { minimum?: number; maximum?: number } }
  | { type: 'not'; pattern: Node }
  | { type: 'regexp'; value: RegExp }
  | { type: 'shape'; fields: { key: string; optional: boolean; pattern: Node }[] }
  | { type: 'tuple'; items: Node[]; rest: Node | null }
  | { type: 'union'; options: Node[] };

export interface Typeshift {
  <R>(cases: Cases<R>): (target: unknown) => R;
  with(additions: Record<string, Predicate | string>): Typeshift;
  matches(pattern: string, value: unknown): boolean;
  predicate(pattern: string): Predicate;
  readonly types: Record<string, Predicate | string>;
}

export function createTypeshift(types?: Record<string, Predicate | string>): Typeshift;
export function parse(pattern: string): Node;
export const pureTypeshift: Typeshift;
export const typeshift: Typeshift;
export default typeshift;
