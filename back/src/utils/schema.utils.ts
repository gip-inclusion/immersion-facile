import { castError } from "shared";
import type { z } from "zod";
import type { OpacifiedLogger } from "./logger";

export const parseZodSchemaAndLogErrorOnParsingFailure = <T>(
  schema: z.Schema<T>,
  schemaParsingInput: unknown,
  logger: OpacifiedLogger,
): T => {
  try {
    return schema.parse(schemaParsingInput);
  } catch (error) {
    logger.error({
      error: castError(error),
      message: `Parsing failed with schema '${schema.constructor.name}'`,
    });
    throw error;
  }
};
