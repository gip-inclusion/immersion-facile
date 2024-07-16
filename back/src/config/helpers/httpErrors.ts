import { BadRequestError } from "shared";
import { z } from "zod";
import { OpacifiedLogger } from "../../utils/logger";

export const validateAndParseZodSchema = <T>(
  inputSchema: z.Schema<T>,
  schemaParsingInput: any,
  logger: OpacifiedLogger,
): T => {
  const result = inputSchema.safeParse(schemaParsingInput);
  if (result.success) return result.data;
  logger.error({
    schemaParsingInput,
    message: `ValidateAndParseZodSchema failed - ${inputSchema.constructor.name}`,
  });
  throw new BadRequestError(result.error as any);
};

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
  throw new BadRequestError(
    "Schema validation failed",
    result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`,
    ),
  );
};
