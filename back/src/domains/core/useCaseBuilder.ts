import * as Sentry from "@sentry/node";
import type { ZodSchemaWithInputMatchingOutput } from "shared";
import { z } from "zod";
import { createLogger } from "../../utils/logger";
import type { UnitOfWork } from "./unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "./unit-of-work/ports/UnitOfWorkPerformer";
import {
  type UseCaseIdentityPayload,
  useCaseLoggerWrapper,
  validateUseCaseInput,
} from "./useCase.helpers";

const logger = createLogger(__filename);

type UseCaseBuilder<
  Output,
  Input,
  Deps,
  P extends UseCaseIdentityPayload,
  IsTransactional = true,
> = {
  withInput: <I>(
    schema: z.ZodType<I, any>,
  ) => UseCaseBuilder<Output, I, Deps, P, IsTransactional>;
  withOutput: <O>() => UseCaseBuilder<O, Input, Deps, P, IsTransactional>;
  withDeps: <D>() => UseCaseBuilder<Output, Input, D, P, IsTransactional>;
  withCurrentUser: <CU extends UseCaseIdentityPayload>() => UseCaseBuilder<
    Output,
    Input,
    Deps,
    CU,
    IsTransactional
  >;
  notTransactional: () => UseCaseBuilder<Output, Input, Deps, P, false>;
  build: <
    Cb extends IsTransactional extends true
      ? (args: {
          inputParams: Input;
          currentUser: P;
          deps: Deps;
          uow: UnitOfWork;
        }) => Promise<Output>
      : (args: {
          inputParams: Input;
          currentUser: P;
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
      : Deps extends void
        ? // biome-ignore lint/complexity/noBannedTypes: less wide than Record<string, any>
          {}
        : { deps: Deps },
  ) => {
    useCaseName: string;
    execute: (params: Input, currentUser: P) => ReturnType<Cb>;
  };
};

export const useCaseBuilder = <
  Output,
  Input = void,
  Deps = void,
  P extends UseCaseIdentityPayload = void,
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
): UseCaseBuilder<Output, Input, Deps, P, IsTransactional> => ({
  withInput: <I>(inputSchema: ZodSchemaWithInputMatchingOutput<I>) =>
    useCaseBuilder<Output, I, Deps, P, IsTransactional>(useCaseName, {
      inputSchema,
      isTransactional: options.isTransactional,
    }),
  withOutput: <O>() =>
    useCaseBuilder<O, Input, Deps, P, IsTransactional>(useCaseName, options),
  withDeps: <D>() =>
    useCaseBuilder<Output, Input, D, P, IsTransactional>(useCaseName, options),
  withCurrentUser: <CU extends UseCaseIdentityPayload>() =>
    useCaseBuilder<Output, Input, Deps, CU, IsTransactional>(
      useCaseName,
      options,
    ),
  notTransactional: () =>
    useCaseBuilder<Output, Input, Deps, P, false>(useCaseName, {
      inputSchema: options.inputSchema,
      isTransactional: false as false,
    }),
  build: (cb) => (config) => ({
    useCaseName,
    execute: (async (input: Input, payload: P) =>
      useCaseLoggerWrapper({
        useCaseName,
        startDate: new Date(),
        logger,
        validInput: validateUseCaseInput({
          useCaseName,
          inputSchema: options.inputSchema,
          input: input,
          logger,
        }),
        payload,
        cb: ({ useCaseName, validInput, payload }) => {
          const commonCbParams = {
            inputParams: validInput,
            deps: (config as any).deps,
            currentUser: payload,
          };

          return options.isTransactional
            ? (config as any).uowPerformer.perform((uow: UnitOfWork) =>
                Sentry.startSpan({ name: useCaseName }, () =>
                  cb({
                    ...commonCbParams,
                    uow,
                  } as any),
                ),
              )
            : Sentry.startSpan({ name: useCaseName }, () =>
                cb(commonCbParams as any),
              );
        },
      })) as any,
  }),
});
