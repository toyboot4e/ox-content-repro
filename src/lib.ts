/** Minimum repro module: one class, one type, one function — each renders one
 * of the reported API-docs bugs. */

/** A counter with TypeScript-`private` state. The two private fields must not
 * appear in the generated reference (`private: false`), yet they do. */
export class Counter {
  private count: number = 0;
  /** Documented private field — leaks into the docs with its description. */
  private readonly step: number = 1;

  /** Advance the counter by its step. */
  increment(): number {
    this.count += this.step;
    return this.count;
  }
}

/** Options with `readonly` members. In the rendered members table the
 * `readonly` badge is emitted back-to-back with the member name
 * (`initial`readonly) and the built-in theme ships no `.ox-api-badge` rule —
 * nor any rule for the members table / member detail markup. */
export type CounterOptions = {
  /** Where counting starts. */
  readonly initial: number;
  /** How far each increment moves. */
  readonly step?: number;
};

/** The parameter's type chip (`CounterOptions`) renders on the code-block
 * palette plus a hardcoded dark navy, so it shows as a dark pill even in
 * light theme. */
export function createCounter(options: CounterOptions): Counter {
  void options;
  return new Counter();
}
