import {
  type ApiConsumer,
  type ConnectedUser,
  type ConnectedUserDomainJwtPayload,
  type ConventionDomainPayload,
  calculateDurationInSecondsFrom,
  castError,
  type LegacySearchQueryParamsDto,
  type ZodSchemaWithInputMatchingOutput,
} from "shared";
import { validateAndParseZodSchema } from "../../config/helpers/validateAndParseZodSchema";
import type { OpacifiedLogger } from "../../utils/logger";

export const getSearchParams = (
  useCaseName: string,
  params: unknown,
): LegacySearchQueryParamsDto | undefined => {
  if (useCaseName === "SearchImmersion")
    return params as LegacySearchQueryParamsDto;
};

export const extractValue = (
  propName: string,
  params: unknown,
): string | undefined => {
  if (typeof params !== "object" || params === null) return undefined;

  if (propName in params) {
    return (params as Record<string, unknown>)[propName] as string;
  }

  for (const value of Object.values(params)) {
    if (typeof value === "object" && value !== null && propName in value) {
      return (value as Record<string, unknown>)[propName] as string;
    }
  }

  return undefined;
};

export type UseCaseIdentityPayload =
  | ConventionDomainPayload
  | ConnectedUserDomainJwtPayload
  | ConnectedUser
  | ApiConsumer
  | void;

export const useCaseLoggerWrapper = <
  Input,
  Output,
  P extends UseCaseIdentityPayload = void,
>({
  cb,
  useCaseName,
  startDate,
  logger,
  validInput,
  payload,
}: {
  cb: (param: {
    useCaseName: string;
    validInput: Input;
    payload: P;
  }) => Promise<Output>;
  useCaseName: string;
  startDate: Date;
  logger: OpacifiedLogger;
  validInput: Input;
  payload: P;
}): Promise<Output> =>
  cb({ useCaseName, validInput, payload })
    .then((result) => {
      logger.info({
        useCaseName,
        durationInSeconds: calculateDurationInSecondsFrom(startDate),
        logStatus: "ok",
      });

      return result;
    })
    .catch((error) => {
      const searchParams = getSearchParams(useCaseName, validInput);
      logger.error({
        useCaseName,
        durationInSeconds: calculateDurationInSecondsFrom(startDate),
        searchParams,
        userId: payload && "userId" in payload ? payload.userId : undefined,
        message: castError(error).message,
      });
      throw error;
    });

export const validateUseCaseInput = <Input = void>({
  useCaseName,
  inputSchema,
  input,
  logger,
}: {
  useCaseName: string;
  inputSchema: ZodSchemaWithInputMatchingOutput<Input>;
  input: Input;
  logger: OpacifiedLogger;
}): Input =>
  validateAndParseZodSchema({
    useCaseName,
    inputSchema,
    schemaParsingInput: input,
    logger,
    id: extractValue("id", input) ?? extractValue("siret", input),
  });
