import { errors } from "shared";
import { type z, treeifyError } from "zod/v4";
import type { OpacifiedLogger } from "../../utils/logger";

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
  const flattenErrors = treeifyError(result.error).errors;
  throw errors.inputs.badSchema({ flattenErrors });
};
