import { complement, propEq as ramdaPropEq } from "ramda";

// prettier-ignore
export function propEq<K extends keyof Obj, Obj>(name: Exclude<K, symbol>, val: Obj[K], obj: Obj, ): boolean;
// prettier-ignore
export function propEq<K extends keyof Obj, Obj>(name: Exclude<K, symbol>, val: Obj[K]): (obj: Obj, ) => boolean;
// prettier-ignore
export function propEq<K extends keyof Obj, Obj>(name: Exclude<K, symbol>, val: Obj[K], obj?: Obj) {
  const f = ramdaPropEq(name, val);
  return typeof obj === "undefined"? f : f(obj)
}

//prettier-ignore
export function propNotEq<K extends keyof Obj, Obj>( name: Exclude<K, symbol>, val: Obj[K], obj: Obj, ): boolean;
//prettier-ignore
export function propNotEq<K extends keyof Obj, Obj>( name: Exclude<K, symbol>, val: Obj[K], ): (obj: Obj) => boolean;
//prettier-ignore
export function propNotEq<K extends keyof Obj, Obj>( name: Exclude<K, symbol>, val: Obj[K], obj?: Obj, ) {
  const f = complement(ramdaPropEq(name, val));
  return typeof obj === "undefined" ? f : f(obj);
}
