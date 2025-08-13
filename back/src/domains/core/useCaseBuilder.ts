import * as Sentry from "@sentry/node";
import {
  calculateDurationInSecondsFrom,
  castError,
  type ZodSchemaWithInputMatchingOutput,
} from "shared";
import { z } from "zod";
import { validateAndParseZodSchemaV2 } from "../../config/helpers/validateAndParseZodSchema";
import { createLogger } from "../../utils/logger";
import type { UnitOfWork } from "./unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "./unit-of-work/ports/UnitOfWorkPerformer";
import { extractValue, getSearchParams } from "./useCase.helpers";

const logger = createLogger(__filename);

type UseCaseBuilder<Output, Input, Deps, CurrentUser> = {
  withInput: <I>(
    schema: ZodSchemaWithInputMatchingOutput<I>,
  ) => UseCaseBuilder<Output, I, Deps, CurrentUser>;
  withOutput: <O>() => UseCaseBuilder<O, Input, Deps, CurrentUser>;
  withDeps: <D>() => UseCaseBuilder<Output, Input, D, CurrentUser>;
  withCurrentUser: <CU>() => UseCaseBuilder<Output, Input, Deps, CU>;
  build: <
    Cb extends (args: {
      inputParams: Input;
      currentUser: CurrentUser;
      deps: Deps;
      uow: UnitOfWork;
    }) => Promise<Output>,
  >(
    cb: Cb,
  ) => (
    setupParams: {
      uowPerformer: UnitOfWorkPerformer;
      // biome-ignore lint/complexity/noBannedTypes: less wide than Record<string, any>
    } & (Deps extends void ? {} : { deps: Deps }),
  ) => {
    useCaseName: string;
    execute: (params: Input, currentUser: CurrentUser) => ReturnType<Cb>;
  };
};

export const useCaseBuilder = <
  Output,
  Input = void,
  Deps = void,
  CurrentUser = void,
>(
  useCaseName: string,
  options: { inputSchema: ZodSchemaWithInputMatchingOutput<Input> } = {
    inputSchema: z.void() as unknown as ZodSchemaWithInputMatchingOutput<Input>,
  },
): UseCaseBuilder<Output, Input, Deps, CurrentUser> => ({
  withInput: <I>(inputSchema: ZodSchemaWithInputMatchingOutput<I>) =>
    useCaseBuilder<Output, I, Deps, CurrentUser>(useCaseName, { inputSchema }),
  withOutput: <O>() =>
    useCaseBuilder<O, Input, Deps, CurrentUser>(useCaseName, options),
  withDeps: <D>() =>
    useCaseBuilder<Output, Input, D, CurrentUser>(useCaseName, options),
  withCurrentUser: <CU>() =>
    useCaseBuilder<Output, Input, Deps, CU>(useCaseName, options),
  build: (cb) => (config) => ({
    useCaseName,
    execute: (async (inputParams: Input, currentUser: CurrentUser) => {
      const startDate = new Date();
      const validParams = validateAndParseZodSchemaV2({
        useCaseName,
        inputSchema: options.inputSchema,
        schemaParsingInput: inputParams,
        logger,
        id:
          extractValue("id", inputParams) ?? extractValue("siret", inputParams),
      });
      const searchParams = getSearchParams(useCaseName, validParams);

      return config.uowPerformer
        .perform((uow) =>
          Sentry.startSpan({ name: useCaseName }, async () =>
            cb({
              inputParams: validParams,
              uow,
              deps: (config as any).deps,
              currentUser,
            }),
          ),
        )
        .then((result) => {
          logger.info({
            useCaseName,
            durationInSeconds: calculateDurationInSecondsFrom(startDate),
            logStatus: "ok",
          });
          return result;
        })
        .catch((error) => {
          logger.error({
            useCaseName,
            durationInSeconds: calculateDurationInSecondsFrom(startDate),
            searchParams,
            message: castError(error).message,
          });
          throw error;
        });
    }) as any,
  }),
});
