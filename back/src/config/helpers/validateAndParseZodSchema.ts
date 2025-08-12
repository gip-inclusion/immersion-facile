import { errors, type ZodSchemaWithInputMatchingOutput } from "shared";
import type { ZodError } from "zod";
import type { $ZodIssue } from "zod/v4/core/errors.cjs";
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
  const flattenErrors = flattenZodErrors(result.error);
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

const flattenZodErrors = (
  error: ZodError<any>,
  path: PropertyKey[] = [],
): string[] => {
  const result = error.issues.reduce<string[]>((acc, issue: $ZodIssue) => {
    const currentPath = [...path, ...(issue.path || [])];

    // if (issue.code === "invalid_union" && issue.errors) {
    //   const unionMessages = issue.errors.reduce<string[]>(
    //     (unionMsgs: string[], unionError: $ZodIssue[]) => {
    //       return unionMsgs.concat(flattenZodErrors(unionError, currentPath));
    //     },
    //     [],
    //   );
    //   return [...acc, ...unionMessages];
    // }

    const key = currentPath.join(".");
    const message = issue.message;
    const flatMessage = key ? `${key} : ${message}` : message;
    return [...acc, flatMessage];
  }, []);

  return Array.from(new Set(result));
};
