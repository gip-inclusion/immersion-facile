import { errors, flattenZodErrors } from "shared";
import { z } from "zod";
import { OpacifiedLogger } from "../../utils/logger";

export const validateAndParseZodSchemaV2 = <T>(
  inputSchema: z.Schema<T>,
  schemaParsingInput: unknown,
  logger: OpacifiedLogger,
): T => {
  const result = inputSchema.safeParse(schemaParsingInput);
  if (result.success) return result.data;

  logger.error({
    schemaParsingInput,
    message: `ValidateAndParseZodSchema failed - ${inputSchema.constructor.name}`,
  });
  const flattenErrors = flattenZodErrors(result.error);
  throw errors.inputs.badSchema({ flattenErrors });
};
