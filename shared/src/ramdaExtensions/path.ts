// Read this to understand the typings : https://dev.to/tipsy_dev/advanced-typescript-reinventing-lodash-get-4fhe
// prettier-ignore
type GetFieldType<Obj, Path> = Path extends `${infer Left}.${infer Right}`
  ? Left extends keyof Obj
    ? GetFieldType<Exclude<Obj[Left], undefined>, Right> | Extract<Obj[Left], undefined>
    : undefined
  : Path extends keyof Obj
    ? Obj[Path]
    : undefined

// prettier-ignore
export function path<Path extends string, Obj>(strPath: Path, obj: Obj): GetFieldType<Obj, Path>
// prettier-ignore
export function path <Path extends string, Obj>(strPath: Path): (obj: Obj) => GetFieldType<Obj, Path>
// prettier-ignore
export function path <Path extends string, Obj>(strPath: Path, obj?: Obj): any {
  const f = (obj: Obj) => strPath
    .split(".")
    .reduce<GetFieldType<Obj, Path>>(
      (acc, key) => (acc as any)?.[key],
      obj as any,
    );

  if(typeof obj === "undefined") return f
  return f(obj)
}

// prettier-ignore
export function pathEq<Path extends string, Obj>(strPath: Path, value: GetFieldType<Obj, Path>, obj: Obj): boolean
// prettier-ignore
export function pathEq<Path extends string, Obj>(strPath: Path, value: GetFieldType<Obj, Path>): (obj: Obj) => boolean
// prettier-ignore
export function pathEq<Path extends string, Obj>(strPath: Path, value: GetFieldType<Obj, Path>, obj?: Obj): any {
  const f = (obj: Obj) => value === path(strPath, obj);

  if(typeof obj === "undefined") return f
  return f(obj)
}

// prettier-ignore
export function pathNotEq<Path extends string, Obj>(strPath: Path, value: GetFieldType<Obj, Path>, obj: Obj): boolean
// prettier-ignore
export function pathNotEq<Path extends string, Obj>(strPath: Path, value: GetFieldType<Obj, Path>): (obj: Obj) => boolean
// prettier-ignore
export function pathNotEq<Path extends string, Obj>(strPath: Path, value: GetFieldType<Obj, Path>, obj?: Obj): any {
  const f = (obj: Obj) => value !== path(strPath, obj);

  if(typeof obj === "undefined") return f
  return f(obj)
}
