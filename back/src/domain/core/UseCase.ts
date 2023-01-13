import { ConventionMagicLinkPayload } from "shared";
import { z } from "zod";
import {
  BadRequestError,
  validateAndParseZodSchema,
} from "../../adapters/primary/helpers/httpErrors";
import { createLogger } from "../../utils/logger";
import { UnitOfWork, UnitOfWorkPerformer } from "./ports/UnitOfWork";

const logger = createLogger(__filename);

export abstract class UseCase<
  Input,
  Output = void,
  JWTPayload = ConventionMagicLinkPayload,
> {
  protected abstract inputSchema: z.ZodSchema<Input>;

  // this methode should not be overwritten, implement _execute instead
  public async execute(
    params: Input,
    jwtPayload?: JWTPayload,
  ): Promise<Output> {
    const useCaseName = this.constructor.name;
    logger.info(`UseCase execution start - ${useCaseName}`);
    let validParams: Input;
    try {
      validParams = validateAndParseZodSchema(this.inputSchema, params);
    } catch (e) {
      throw new BadRequestError(e);
    }
    const result = this._execute(validParams, jwtPayload);

    logger.info(`UseCase execution Finished - ${useCaseName}`);
    return result;
  }

  // this method is guaranteed to only receive validated params
  protected abstract _execute(
    params: Input,
    jwtPayload?: JWTPayload,
  ): Promise<Output>;
}

export abstract class TransactionalUseCase<
  Input,
  Output = void,
  JWTPayload = ConventionMagicLinkPayload,
> {
  protected abstract inputSchema: z.ZodSchema<Input>;
  protected constructor(private uowPerformer: UnitOfWorkPerformer) {}

  // this methode should not be overwritten, implement _execute instead
  public async execute(
    params: Input,
    jwtPayload?: JWTPayload,
  ): Promise<Output> {
    const useCaseName = this.constructor.name;
    logger.info(`UseCase execution start - ${useCaseName}`);
    const validParams = validateAndParseZodSchema(this.inputSchema, params);

    try {
      return await this.uowPerformer.perform((uow) =>
        this._execute(validParams, uow, jwtPayload),
      );
    } catch (error: any) {
      logger.error(
        `UseCase execution Errored - ${useCaseName} : ${error?.message}`,
      );
      throw error;
    } finally {
      logger.info(`UseCase execution Finished - ${useCaseName}`);
    }
  }

  protected abstract _execute(
    params: Input,
    uow: UnitOfWork,
    jwtPayload?: JWTPayload,
  ): Promise<Output>;
}
