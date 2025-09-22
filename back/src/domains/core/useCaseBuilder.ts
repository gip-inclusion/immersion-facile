import * as Sentry from "@sentry/node";
import {
  calculateDurationInSecondsFrom,
  castError,
  type ZodSchemaWithInputMatchingOutput,
} from "shared";
import { z } from "zod";
import { validateAndParseZodSchema } from "../../config/helpers/validateAndParseZodSchema";
import { createLogger } from "../../utils/logger";
import type { UnitOfWork } from "./unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "./unit-of-work/ports/UnitOfWorkPerformer";
import { extractValue, getSearchParams } from "./useCase.helpers";

const logger = createLogger(__filename);

type UseCaseBuilder<
  Output,
  Input,
  Deps,
  CurrentUser,
  IsTransactional = true,
> = {
  withInput: <I>(
    schema: z.ZodType<I, any>,
  ) => UseCaseBuilder<Output, I, Deps, CurrentUser, IsTransactional>;
  withOutput: <O>() => UseCaseBuilder<
    O,
    Input,
    Deps,
    CurrentUser,
    IsTransactional
  >;
  withDeps: <D>() => UseCaseBuilder<
    Output,
    Input,
    D,
    CurrentUser,
    IsTransactional
  >;
  withCurrentUser: <CU>() => UseCaseBuilder<
    Output,
    Input,
    Deps,
    CU,
    IsTransactional
  >;
  notTransactional: () => UseCaseBuilder<
    Output,
    Input,
    Deps,
    CurrentUser,
    false
  >;
  build: <
    Cb extends IsTransactional extends true
      ? (args: {
          inputParams: Input;
          currentUser: CurrentUser;
          deps: Deps;
          uow: UnitOfWork;
        }) => Promise<Output>
      : (args: {
          inputParams: Input;
          currentUser: CurrentUser;
          deps: Deps;
        }) => Promise<Output>,
  >(
    cb: Cb,
  ) => (
    setupParams: IsTransactional extends true
      ? {
          uowPerformer: UnitOfWorkPerformer;
          // biome-ignore lint/complexity/noBannedTypes: less wide than Record<string, any>
        } & (Deps extends void ? {} : { deps: Deps })
      : // biome-ignore lint/complexity/noBannedTypes: less wide than Record<string, any>
        Deps extends void
        ? {}
        : { deps: Deps },
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
  IsTransactional = true,
>(
  useCaseName: string,
  options: {
    inputSchema: ZodSchemaWithInputMatchingOutput<Input>;
    isTransactional?: IsTransactional;
  } = {
    inputSchema: z.void() as unknown as ZodSchemaWithInputMatchingOutput<Input>,
    isTransactional: true as IsTransactional,
  },
): UseCaseBuilder<Output, Input, Deps, CurrentUser, IsTransactional> => ({
  withInput: <I>(inputSchema: ZodSchemaWithInputMatchingOutput<I>) =>
    useCaseBuilder<Output, I, Deps, CurrentUser, IsTransactional>(useCaseName, {
      inputSchema,
      isTransactional: options.isTransactional,
    }),
  withOutput: <O>() =>
    useCaseBuilder<O, Input, Deps, CurrentUser, IsTransactional>(
      useCaseName,
      options,
    ),
  withDeps: <D>() =>
    useCaseBuilder<Output, Input, D, CurrentUser, IsTransactional>(
      useCaseName,
      options,
    ),
  withCurrentUser: <CU>() =>
    useCaseBuilder<Output, Input, Deps, CU, IsTransactional>(
      useCaseName,
      options,
    ),
  notTransactional: () =>
    useCaseBuilder<Output, Input, Deps, CurrentUser, false>(useCaseName, {
      inputSchema: options.inputSchema,
      isTransactional: false as false,
    }),
  build: (cb) => (config) => ({
    useCaseName,
    execute: (async (inputParams: Input, currentUser: CurrentUser) => {
      const startDate = new Date();
      const validParams = validateAndParseZodSchema({
        useCaseName,
        inputSchema: options.inputSchema,
        schemaParsingInput: inputParams,
        logger,
        id:
          extractValue("id", inputParams) ?? extractValue("siret", inputParams),
      });

      if (options.isTransactional) {
        const searchParams = getSearchParams(useCaseName, validParams);

        return (config as any).uowPerformer
          .perform((uow: UnitOfWork) =>
            Sentry.startSpan({ name: useCaseName }, async () =>
              cb({
                inputParams: validParams,
                uow,
                deps: (config as any).deps,
                currentUser,
              } as any),
            ),
          )
          .then((result: Output) => {
            logger.info({
              useCaseName,
              durationInSeconds: calculateDurationInSecondsFrom(startDate),
              logStatus: "ok",
            });
            return result;
          })
          .catch((error: any) => {
            logger.error({
              useCaseName,
              durationInSeconds: calculateDurationInSecondsFrom(startDate),
              searchParams,
              message: castError(error).message,
            });
            throw error;
          });
      }

      try {
        const result = await Sentry.startSpan({ name: useCaseName }, () =>
          cb({
            inputParams: validParams,
            currentUser,
            deps: (config as any).deps,
          } as any),
        );

        const durationInSeconds = calculateDurationInSecondsFrom(startDate);
        logger.info({
          useCaseName,
          durationInSeconds,
        });

        return result;
      } catch (error: any) {
        const durationInSeconds = calculateDurationInSecondsFrom(startDate);
        logger.error({
          useCaseName,
          durationInSeconds,
          message: castError(error)?.message,
        });
        throw error;
      }
    }) as any,
  }),
});
