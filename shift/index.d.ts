// @pulgasari/shift - type declarations

/** a predicate: true when the target is of its kind */
export type Predicate = (target: unknown) => boolean;

/** what a case gives: a function of the target, or the result itself */
export type Handler<Result> = Result | ((target: any) => Result);

/** predicate names (with or without `is`) to handlers, plus an optional fallback */
export type Cases<Result> = { fallback?: Handler<Result> } & { [name: string]: Handler<Result> };

export interface Shift {
  /** the cases as a function of the target */
  <Result>(cases: Cases<Result>): (target: unknown) => Result | undefined;

  /** the result for this target right away */
  <Result>(target: unknown, cases: Cases<Result>): Result | undefined;

  /** teaches this instance more predicates */
  with(predicates: Record<string, Predicate>): Shift;

  /** a copy of the predicates this instance knows */
  readonly predicates: Record<string, Predicate>;
}

/** a new instance that knows `predicates` */
export function createShift(predicates?: Record<string, Predicate>): Shift;

/** knows every predicate of @pulgasari/is */
export const shift: Shift;

/** knows no predicate */
export const pureShift: Shift;

export default shift;
