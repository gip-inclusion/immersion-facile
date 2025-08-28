import * as Sentry from "@sentry/node";
import type { Logger } from "pino";
import {
  type ConventionJwtPayload,
  calculateDurationInSecondsFrom,
  castError,
  type ZodSchemaWithInputMatchingOutput,
} from "shared";
import type { z } from "zod";
import { validateAndParseZodSchemaV2 } from "../../config/helpers/validateAndParseZodSchema";
import { createLogger } from "../../utils/logger";
import type { UnitOfWork } from "./unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "./unit-of-work/ports/UnitOfWorkPerformer";
import { extractValue, getSearchParams } from "./useCase.helpers";

const logger = createLogger(__filename);

export abstract class UseCase<
  Input,
  Output = void,
  JWTPayload = ConventionJwtPayload,
> {
  protected abstract inputSchema: ZodSchemaWithInputMatchingOutput<Input>;

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

    const validParams = validateAndParseZodSchemaV2({
      useCaseName,
      inputSchema: this.inputSchema,
      schemaParsingInput: params,
      logger: logger as Logger,
      id: extractValue("id", params) ?? extractValue("siret", params),
    });

    try {
      const result = await Sentry.startSpan({ name: useCaseName }, () =>
        this._execute(validParams, jwtPayload),
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
  }
}

export abstract class TransactionalUseCase<
  Input,
  Output = void,
  JWTPayload = ConventionJwtPayload,
> {
  protected abstract inputSchema: z.ZodType<Input, any>;

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
    const validParams = validateAndParseZodSchemaV2({
      useCaseName,
      inputSchema: this.inputSchema,
      schemaParsingInput: params,
      logger,
      id: extractValue("id", params) ?? extractValue("siret", params),
    });
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
