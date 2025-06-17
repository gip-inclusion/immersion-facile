import { errors, flattenZodErrors } from "shared";
import type { z } from "zod";
import type { OpacifiedLogger } from "../../utils/logger";

export const validateAndParseZodSchemaV2 = <T>({
  inputSchema,
  schemaParsingInput,
  logger,
}: {
  inputSchema: z.Schema<T>;
  schemaParsingInput: unknown;
  logger: OpacifiedLogger;
}): T => {
  const result = inputSchema.safeParse(schemaParsingInput);
  if (result.success) return result.data;

  logger.error({
    schemaParsingInput,
    message: `ValidateAndParseZodSchema failed - ${inputSchema.constructor.name}`,
  });
  const flattenErrors = flattenZodErrors(result.error);
  throw errors.inputs.badSchema({ flattenErrors });
};
