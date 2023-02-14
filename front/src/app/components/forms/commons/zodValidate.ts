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
  error.inner = e.errors
    .map((err) => {
      if (err.code === "invalid_union") {
        //console.log(err);
        return err.unionErrors.map((unionError) =>
          unionError.issues.map((issue) => ({
            message: issue.message,
            path: issue.path.join("."),
          })),
        );
      }
      return {
        message: err.message,
        path: err.path.join("."),
      };
    })
    .flat(2);

  return error;
};

export const toFormikValidationSchema = <T>(
  schema: z.ZodSchema<T>,
): { validate: (obj: T) => void } => ({
  // super strange behavior: we need it to be async so that it correctly works...
  // it broke the siret fetching in the establishment form when it was not...
  // eslint-disable-next-line @typescript-eslint/require-await
  async validate(obj: T): Promise<void> {
    try {
      schema.parse(obj);
    } catch (err: unknown) {
      throw createValidationError(err as z.ZodError<T>);
    }
  },
});
