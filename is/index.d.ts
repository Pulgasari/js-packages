// @pulgasari/is - type declarations

/** a predicate name (with or without the `is` prefix) or a predicate function. */
export type PredicateRef = string | ((value: unknown) => boolean);

/** a rule for testRule: a function, a boolean, or a nested array of rules (all must hold). */
export type Rule = boolean | ((value: unknown) => boolean) | readonly Rule[];

/** evaluates a function/boolean/array rule against a value. */
export function testRule(rule: Rule, value: unknown): boolean;

/** true when every listed predicate holds; an empty list is always false. */
export function is(value: unknown, ...list: PredicateRef[]): boolean;

/** true when every listed predicate fails; an empty list is always false. */
export function isNot(value: unknown, ...list: PredicateRef[]): boolean;

/** true when any listed predicate holds. */
export function isAny(value: unknown, ...list: PredicateRef[]): boolean;

export * from "./predicates.js";
