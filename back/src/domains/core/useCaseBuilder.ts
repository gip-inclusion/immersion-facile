import * as Sentry from "@sentry/node";
import {
  calculateDurationInSecondsFrom,
  castError,
  type SearchQueryParamsDto,
} from "shared";
import { z } from "zod";
import { validateAndParseZodSchemaV2 } from "../../config/helpers/validateAndParseZodSchema";
import { createLogger } from "../../utils/logger";
import type { UnitOfWork } from "./unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "./unit-of-work/ports/UnitOfWorkPerformer";

const logger = createLogger(__filename);

type UseCaseBuilder<Output, Input, Deps, CurrentUser> = {
  withInput: <I>(
    schema: z.Schema<I>,
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
    }) => Output,
  >(
    cb: Cb,
  ) => (
    setupParams: {
      uowPerformer: UnitOfWorkPerformer;
      // biome-ignore lint/complexity/noBannedTypes: less wide than Record<string, any>
    } & (Deps extends void ? {} : { deps: Deps }),
  ) => {
    useCaseName: string;
    execute: (
      params: Input,
      currentUser: CurrentUser,
    ) => Promise<ReturnType<Cb>>;
  };
};

export const useCaseBuilder = <
  Output,
  Input = void,
  Deps = void,
  CurrentUser = void,
>(
  useCaseName: string,
  options: { inputSchema: z.Schema<Input> } = {
    inputSchema: z.void() as unknown as z.Schema<Input>,
  },
): UseCaseBuilder<Output, Input, Deps, CurrentUser> => ({
  withInput: <I>(inputSchema: z.Schema<I>) =>
    useCaseBuilder<Output, I, Deps, CurrentUser>(useCaseName, { inputSchema }),
  withOutput: <O>() =>
    useCaseBuilder<O, Input, Deps, CurrentUser>(useCaseName, options),
  withDeps: <D>() =>
    useCaseBuilder<Output, Input, D, CurrentUser>(useCaseName, options),
  withCurrentUser: <CU>() =>
    useCaseBuilder<Output, Input, Deps, CU>(useCaseName, options),
  build: (cb) => (config) => ({
    useCaseName,
    execute: async (inputParams, currentUser): Promise<any> => {
      const startDate = new Date();
      const validParams = validateAndParseZodSchemaV2({
        useCaseName,
        inputSchema: options.inputSchema,
        schemaParsingInput: inputParams,
        logger,
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
    },
  }),
});

const getSearchParams = (
  useCaseName: string,
  params: unknown,
): SearchQueryParamsDto | undefined => {
  if (useCaseName === "SearchImmersion") return params as SearchQueryParamsDto;
};
