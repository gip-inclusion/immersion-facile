import { castError } from "shared";
import { z } from "zod";
import { OpacifiedLogger } from "./logger";

export const parseZodSchemaAndLogErrorOnParsingFailure = <T>(
  schema: z.Schema<T>,
  schemaParsingInput: unknown,
  logger: OpacifiedLogger,
): T => {
  try {
    return schema.parse(schemaParsingInput);
  } catch (error) {
    logger.error({
      schemaParsingInput,
      error: castError(error),
      message: `Parsing failed with schema '${schema.constructor.name}'`,
    });
    throw error;
  }
};
