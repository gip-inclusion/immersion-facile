import * as Sentry from "@sentry/node";
import type { Logger } from "pino";
import {
  type ConventionJwtPayload,
  type SearchQueryParamsDto,
  calculateDurationInSecondsFrom,
  castError,
} from "shared";
import type { z } from "zod";
import { validateAndParseZodSchemaV2 } from "../../config/helpers/validateAndParseZodSchema";
import { createLogger } from "../../utils/logger";
import type { UnitOfWork } from "./unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "./unit-of-work/ports/UnitOfWorkPerformer";

const logger = createLogger(__filename);

type CreateTransactionalUseCase = <
  Input,
  Output = void,
  CurrentUser = void,
  Dependencies = void,
>(
  {
    name,
    inputSchema,
  }: {
    name: string;
    inputSchema: z.ZodSchema<Input>;
  },
  cb: (params: {
    inputParams: Input;
    uow: UnitOfWork;
    deps: Dependencies;
    currentUser: CurrentUser;
  }) => Promise<Output>,
) => (
  config: {
    uowPerformer: UnitOfWorkPerformer;
  } & (Dependencies extends void
    ? Record<string, any>
    : { deps: Dependencies }),
) => {
  useCaseName: string;
  execute: (params: Input, currentUser: CurrentUser) => Promise<Output>;
};

export const createTransactionalUseCase: CreateTransactionalUseCase =
  ({ name, inputSchema }, cb) =>
  ({ uowPerformer, deps }) => ({
    useCaseName: name,
    execute: async (inputParams, currentUser) => {
      const startDate = new Date();
      const validParams = validateAndParseZodSchemaV2(
        inputSchema,
        inputParams,
        logger,
      );
      const searchParams = getSearchParams(name, validParams);

      return uowPerformer
        .perform((uow) =>
          Sentry.startSpan({ name }, () =>
            cb({ inputParams: validParams, uow, deps, currentUser }),
          ),
        )
        .then((result) => {
          logger.info({
            useCaseName: name,
            durationInSeconds: calculateDurationInSecondsFrom(startDate),
            logStatus: "ok",
          });
          return result;
        })
        .catch((error) => {
          logger.error({
            useCaseName: name,
            durationInSeconds: calculateDurationInSecondsFrom(startDate),
            searchParams,
            message: castError(error).message,
          });
          throw error;
        });
    },
  });

const getSearchParams = (
  useCaseName: string,
  params: unknown,
): SearchQueryParamsDto | undefined => {
  if (useCaseName === "SearchImmersion") return params as SearchQueryParamsDto;
};

export abstract class UseCase<
  Input,
  Output = void,
  JWTPayload = ConventionJwtPayload,
> {
  protected abstract inputSchema: z.ZodSchema<Input>;

  // this method is guaranteed to only receive validated params
  protected abstract _execute(
    params: Input,
    jwtPayload?: JWTPayload,
  ): Promise<Output>;

  // this methode should not be overwritten, implement _execute instead
  public async execute(
    params: Input,
    jwtPayload?: JWTPayload,
  ): Promise<Output> {
    const startDate = new Date();
    const useCaseName = this.constructor.name;

    const validParams = validateAndParseZodSchemaV2(
      this.inputSchema,
      params,
      logger as Logger,
    );

    const result = await Sentry.startSpan({ name: useCaseName }, () =>
      this._execute(validParams, jwtPayload),
    );
    const durationInSeconds = calculateDurationInSecondsFrom(startDate);
    logger.info({
      useCaseName,
      durationInSeconds,
    });

    return result;
  }
}

export abstract class TransactionalUseCase<
  Input,
  Output = void,
  JWTPayload = ConventionJwtPayload,
> {
  protected abstract inputSchema: z.ZodSchema<Input>;

  public constructor(private uowPerformer: UnitOfWorkPerformer) {}

  protected abstract _execute(
    params: Input,
    uow: UnitOfWork,
    jwtPayload?: JWTPayload,
  ): Promise<Output>;

  // this method should not be overwritten, implement _execute instead
  public async execute(
    params: Input,
    jwtPayload?: JWTPayload,
  ): Promise<Output> {
    const startDate = new Date();
    const useCaseName = this.constructor.name;
    const validParams = validateAndParseZodSchemaV2(
      this.inputSchema,
      params,
      logger,
    );
    const searchParams = getSearchParams(useCaseName, validParams);

    return this.uowPerformer
      .perform((uow) =>
        Sentry.startSpan({ name: useCaseName }, () =>
          this._execute(validParams, uow, jwtPayload),
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
  }
}
