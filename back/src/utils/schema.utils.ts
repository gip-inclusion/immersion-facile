import { castError } from "shared";
import { z } from "zod";
import { OpacifiedLogger } from "./logger";

export const parseZodSchemaAndLogErrorOnParsingFailure = <T>(
  schema: z.Schema<T>,
  data: unknown,
  logger: OpacifiedLogger,
  context: Record<string, string>,
): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    logger.error({
      context,
      data,
      error: castError(error),
      message: `Parsing failed with schema '${schema.constructor.name}'`,
    });
    throw error;
  }
};
