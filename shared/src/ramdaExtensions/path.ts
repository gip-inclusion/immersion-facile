// Read this to understand the typings : https://dev.to/tipsy_dev/advanced-typescript-reinventing-lodash-get-4fhe
type GetFieldType<Obj, Path> = Path extends `${infer Left}.${infer Right}`
  ? Left extends keyof Obj
    ?
        | GetFieldType<Exclude<Obj[Left], undefined>, Right>
        | Extract<Obj[Left], undefined>
    : undefined
  : Path extends keyof Obj
    ? Obj[Path]
    : undefined;

export function path<Path extends string, Obj>(
  strPath: Path,
  obj: Obj,
): GetFieldType<Obj, Path>;

export function path<Path extends string, Obj>(
  strPath: Path,
): (obj: Obj) => GetFieldType<Obj, Path>;

export function path<Path extends string, Obj>(strPath: Path, obj?: Obj): any {
  const f = (obj: Obj) =>
    strPath
      .split(".")
      .reduce<GetFieldType<Obj, Path>>(
        (acc, key) => (acc as any)?.[key],
        obj as any,
      );

  if (typeof obj === "undefined") return f;
  return f(obj);
}

export function pathEq<Path extends string, Obj>(
  strPath: Path,
  value: GetFieldType<Obj, Path>,
  obj: Obj,
): boolean;

export function pathEq<Path extends string, Obj>(
  strPath: Path,
  value: GetFieldType<Obj, Path>,
): (obj: Obj) => boolean;

export function pathEq<Path extends string, Obj>(
  strPath: Path,
  value: GetFieldType<Obj, Path>,
  obj?: Obj,
): any {
  const f = (obj: Obj) => value === path(strPath, obj);

  if (typeof obj === "undefined") return f;
  return f(obj);
}

export function pathNotEq<Path extends string, Obj>(
  strPath: Path,
  value: GetFieldType<Obj, Path>,
  obj: Obj,
): boolean;

export function pathNotEq<Path extends string, Obj>(
  strPath: Path,
  value: GetFieldType<Obj, Path>,
): (obj: Obj) => boolean;

export function pathNotEq<Path extends string, Obj>(
  strPath: Path,
  value: GetFieldType<Obj, Path>,
  obj?: Obj,
): any {
  const f = (obj: Obj) => value !== path(strPath, obj);

  if (typeof obj === "undefined") return f;
  return f(obj);
}
