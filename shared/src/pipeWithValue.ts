// eslint-disable @typescript-eslint/ban-types
export function pipeWithValue<A>(a: A): A;
// biome-ignore format: better readability without formatting
export function pipeWithValue<A, B>(a: A, ab: (a: A) => B): B;
// biome-ignore format: better readability without formatting
export function pipeWithValue<A, B, C>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
): C;
// biome-ignore format: better readability without formatting
export function pipeWithValue<A, B, C, D>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
): D;
// biome-ignore format: better readability without formatting
export function pipeWithValue<A, B, C, D, E>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
): E;
// biome-ignore format: better readability without formatting
export function pipeWithValue<A, B, C, D, E, F>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
): F;
// biome-ignore format: better readability without formatting
export function pipeWithValue<A, B, C, D, E, F, G>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
): G;
// biome-ignore format: better readability without formatting
export function pipeWithValue<A, B, C, D, E, F, G, H>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
): H;
// biome-ignore format: better readability without formatting
export function pipeWithValue<A, B, C, D, E, F, G, H, I>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
): I;

/* eslint-disable */

// biome-ignore format: better readability without formatting
export function pipeWithValue(
  a: unknown,
  ab?: AnyFunction,
  bc?: AnyFunction,
  cd?: AnyFunction,
  de?: AnyFunction,
  ef?: AnyFunction,
  fg?: AnyFunction,
  gh?: AnyFunction,
  hi?: AnyFunction,
): unknown {
  // biome-ignore lint/style/noArguments: <explanation>
  switch  (arguments.length) {
    case 1:
      return a;
    case 2:
      return ab?.(a);
    case 3:
      return bc?.(ab?.(a));
    case 4:
      return cd?.(bc?.(ab?.(a)));
    case 5:
      return de?.(cd?.(bc?.(ab?.(a))));
    case 6:
      return ef?.(de?.(cd?.(bc?.(ab?.(a)))));
    case 7:
      return fg?.(ef?.(de?.(cd?.(bc?.(ab?.(a))))));
    case 8:
      return gh?.(fg?.(ef?.(de?.(cd?.(bc?.(ab?.(a)))))));
    case 9:
      return hi?.(gh?.(fg?.(ef?.(de?.(cd?.(bc?.(ab?.(a))))))));
    default:
      throw Error(
        "Cannot handle so many arguments, check : https://github.com/gcanti/fp-ts/blob/master/src/function.ts",
      );
  }
}

// biome-ignore lint/complexity/noBannedTypes: <explanation>
type AnyFunction = Function;
/* eslint-enable */
