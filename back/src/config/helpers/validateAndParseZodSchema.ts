import { errors, flattenZodErrors } from "shared";
import type { z } from "zod";
import type { OpacifiedLogger } from "../../utils/logger";

export const validateAndParseZodSchemaV2 = <T>(
  props: {
    inputSchema: z.Schema<T>;
    schemaParsingInput: unknown;
    logger: OpacifiedLogger;
    id?: string;
  } & ({ schemaName: string } | { useCaseName: string }),
): T => {
  const result = props.inputSchema.safeParse(props.schemaParsingInput);
  if (result.success) return result.data;

  props.logger.error({
    message: `ValidateAndParseZodSchema failed - ${"schemaName" in props ? props.schemaName : props.useCaseName} ${props.id}`,
  });
  const flattenErrors = flattenZodErrors(result.error);
  throw errors.inputs.badSchema({
    context: "schemaName" in props ? props.schemaName : props.useCaseName,
    id: props.id,
    flattenErrors,
  });
};
