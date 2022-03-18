export const optional = <T>(v: T | null) => v ?? undefined;
export const valueOrFalse = <T>(v: T | null) => v ?? false;
