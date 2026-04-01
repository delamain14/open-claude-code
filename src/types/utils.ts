/**
 * Stub: Generic utility types used throughout the codebase.
 */

/**
 * Recursively marks every property in T (and nested objects/arrays) as
 * `readonly`. Used to guarantee tool results and messages are not mutated
 * after creation.
 */
export type DeepImmutable<T> = T extends (infer R)[]
  ? ReadonlyArray<DeepImmutable<R>>
  : T extends object
    ? { readonly [K in keyof T]: DeepImmutable<T[K]> }
    : T

/**
 * Produces a union of all possible permutations of a string-literal union.
 * Used by the message queue manager for discriminated unions.
 */
export type Permutations<T extends string, U extends string = T> = T extends unknown
  ? T | `${T}_${Permutations<Exclude<U, T>>}`
  : never
