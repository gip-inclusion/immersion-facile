import { errors, type ZodSchemaWithInputMatchingOutput } from "shared";
import { flattenError } from "zod";
import type { OpacifiedLogger } from "../../utils/logger";

export const validateAndParseZodSchemaV2 = <T>(
  props: {
    inputSchema: ZodSchemaWithInputMatchingOutput<T>;
    schemaParsingInput: unknown;
    logger: OpacifiedLogger;
    id?: string;
  } & ({ schemaName: string } | { useCaseName: string }),
): T => {
  const result = props.inputSchema.safeParse(props.schemaParsingInput);
  if (result.success) return result.data;

  const flattenErrors = flattenError(result.error).formErrors;

  const error = errors.inputs.badSchema({
    id: props.id,
    flattenErrors,
    ...("schemaName" in props
      ? { schemaName: props.schemaName }
      : { useCaseName: props.useCaseName }),
  });

  props.logger.error({
    message: `${error.message}${
      error.issues?.length
        ? `
    Issues:
    ${error.issues.join("\n")}`
        : ""
    }${"schemaName" in props && props.schemaName === "externalFtConnectUserSchema" ? `\n Input: ${JSON.stringify(props.schemaParsingInput)}` : ""}`,
  });

  throw error;
};
