import { Logger } from "pino";
import {
  ConventionJwtPayload,
  SearchQueryParamsDto,
  calculateDurationInSecondsFrom,
  castError,
} from "shared";
import { z } from "zod";
import { validateAndParseZodSchema } from "../../config/helpers/validateAndParseZodSchema";
import { createLogger } from "../../utils/logger";
import { UnitOfWork } from "./unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "./unit-of-work/ports/UnitOfWorkPerformer";

const logger = createLogger(__filename);

type CreateTransactionalUseCase = <
  Input,
  Output = void,
  UserIdentity = void,
  Dependencies = void,
>(
  {
    name,
    inputSchema,
  }: {
    name: string;
    inputSchema: z.ZodSchema<Input>;
  },
  cb: (
    params: Input,
    { uow, deps }: { uow: UnitOfWork; deps: Dependencies },
    userIdentity: UserIdentity,
  ) => Promise<Output>,
) => (
  config: {
    uowPerformer: UnitOfWorkPerformer;
  } & (Dependencies extends void
    ? Record<string, any>
    : { deps: Dependencies }),
) => {
  useCaseName: string;
  execute: (params: Input, userIdentity: UserIdentity) => Promise<Output>;
};

export const createTransactionalUseCase: CreateTransactionalUseCase =
  ({ name, inputSchema }, cb) =>
  ({ uowPerformer, deps }) => ({
    useCaseName: name,
    execute: async (inputParams, userIdentity) => {
      const startDate = new Date();
      const validParams = validateAndParseZodSchema(
        inputSchema,
        inputParams,
        logger,
      );
      const searchParams = getSearchParams(name, validParams);

      return uowPerformer
        .perform((uow) => cb(validParams, { uow, deps }, userIdentity))
        .then((result) => {
          logger.info({
            useCaseName: name,
            status: "success",
            durationInSeconds: calculateDurationInSecondsFrom(startDate),
          });
          return result;
        })
        .catch((error) => {
          logger.error({
            useCaseName: name,
            status: "error",
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

    const validParams = validateAndParseZodSchema(
      this.inputSchema,
      params,
      logger as Logger,
    );

    const result = await this._execute(validParams, jwtPayload);
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
    const validParams = validateAndParseZodSchema(
      this.inputSchema,
      params,
      logger,
    );
    const searchParams = getSearchParams(useCaseName, validParams);

    return this.uowPerformer
      .perform((uow) => this._execute(validParams, uow, jwtPayload))
      .then((result) => {
        logger.info({
          useCaseName,
          status: "success",
          durationInSeconds: calculateDurationInSecondsFrom(startDate),
        });
        return result;
      })
      .catch((error) => {
        logger.error({
          useCaseName,
          status: "error",
          durationInSeconds: calculateDurationInSecondsFrom(startDate),
          searchParams,
          message: castError(error).message,
        });
        throw error;
      });
  }
}
