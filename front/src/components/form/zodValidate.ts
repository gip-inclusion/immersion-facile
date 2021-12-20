// taken from : https://github.com/robertLichtnow/zod-formik-adapter/blob/master/index.ts
// MIT License
// Copyright (c) 2021 zod-formik-adapter

import { z } from "zod";

export class ValidationError extends Error {
  public override name = "ValidationError";
  public inner: Array<{ path: string; message: string }> = [];
  public constructor(message: string) {
    super(message);
  }
}

const createValidationError = (e: z.ZodError) => {
  const error = new ValidationError(e.message);
  error.inner = e.errors.map((err) => ({
    message: err.message,
    path: err.path.join("."),
  }));

  return error;
};

export const toFormikValidationSchema = <T>(
  schema: z.ZodSchema<T>,
): { validate: (obj: T) => Promise<void> } => ({
  async validate(obj: T) {
    try {
      schema.parse(obj);
    } catch (err: unknown) {
      console.log("zod error :", err);
      throw createValidationError(err as z.ZodError<T>);
    }
  },
});
