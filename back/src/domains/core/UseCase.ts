import { Logger } from "pino";
import {
  ConventionJwtPayload,
  calculateDurationInSecondsFrom,
  castError,
  stringToMd5,
} from "shared";
import { z } from "zod";
import {
  BadRequestError,
  validateAndParseZodSchema,
} from "../../config/helpers/httpErrors";
import { createLogger } from "../../utils/logger";
import { UnitOfWork } from "./unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "./unit-of-work/ports/UnitOfWorkPerformer";

const logger = createLogger(__filename);

const createParamsHash = (
  useCaseName: string,
  params: unknown,
): string | undefined => {
  if (
    useCaseName === "CallLaBonneBoiteAndUpdateRepositories" ||
    useCaseName === "SearchImmersion"
  )
    return stringToMd5(JSON.stringify(params));
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
    let validParams: Input;
    try {
      validParams = validateAndParseZodSchema(
        this.inputSchema,
        params,
        logger as Logger,
      );
    } catch (e) {
      throw new BadRequestError(e);
    }
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
    const paramsHash = createParamsHash(useCaseName, validParams);

    return this.uowPerformer
      .perform((uow) => this._execute(validParams, uow, jwtPayload))
      .then((result) => {
        logger.info({
          useCaseName,
          status: "success",
          durationInSeconds: calculateDurationInSecondsFrom(startDate),
          ...(paramsHash ? { paramsHash } : {}),
        });
        return result;
      })
      .catch((error) => {
        logger.error({
          useCaseName,
          status: "error",
          durationInSeconds: calculateDurationInSecondsFrom(startDate),
          ...(paramsHash ? { paramsHash } : {}),
          message: castError(error).message,
        });
        throw error;
      });
  }
}
