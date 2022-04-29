import { complement, propEq as ramdaPropEq } from "ramda";

// prettier-ignore
export function propEq<K extends keyof Obj, Obj>(name: K, val: Obj[K], obj: Obj,): boolean;
// prettier-ignore
export function propEq<K extends keyof Obj, Obj>(name: K, val: Obj[K]): (obj: Obj) => boolean;
// prettier-ignore
export function propEq<K extends keyof Obj, Obj>(name: K, val: Obj[K], obj?: Record<K, any>): any {
  const f = ramdaPropEq(name as any, val);

  if(typeof obj === "undefined") return f
  return f(obj)
}

// prettier-ignore
export function propNotEq<K extends keyof Obj, Obj>(name: K, val: Obj[K], obj: Obj,): boolean;
// prettier-ignore
export function propNotEq<K extends keyof Obj, Obj>(name: K, val: Obj[K]): (obj: Obj) => boolean;
// prettier-ignore
export function propNotEq<K extends keyof Obj, Obj>(name: K, val: Obj[K], obj?: Record<K, any>): any {
  const f = complement(ramdaPropEq(name as any, val))

  if(typeof obj === "undefined") return f
  return f(obj)
}
