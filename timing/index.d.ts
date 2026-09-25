// @pulgasari/timing - type declarations

export type Cancel = () => void;
export type Cancellable<A extends unknown[]> = ((...args: A) => void) & { cancel: Cancel };

export function interval(fn: () => void, delay?: number): Cancel;
export function timeout(fn: () => void, delay?: number): Cancel;
export function sleep(duration?: number): Promise<void>;
/** requestIdleCallback, a 1ms timeout where it is missing (safari). */
export function idle(fn: (deadline: { didTimeout: boolean; timeRemaining(): number }) => void, deadline?: number): Cancel;
/** resolves with the timestamp of the next animation frame. */
export function nextFrame(): Promise<number>;

/** runs once the calls have stopped for `delay` ms, with the last arguments. */
export function debounce<A extends unknown[]>(callback: (...args: A) => void, delay?: number): Cancellable<A>;
/** at most once per `delay` ms, leading and trailing. */
export function throttle<A extends unknown[]>(callback: (...args: A) => void, delay?: number): Cancellable<A>;
/** at most once per animation frame, with the last arguments. */
export function rafThrottle<A extends unknown[]>(callback: (...args: A) => void): Cancellable<A>;
