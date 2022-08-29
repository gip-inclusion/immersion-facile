import { ConventionMagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";
import { z } from "zod";
import {
  BadRequestError,
  validateAndParseZodSchema,
} from "../../adapters/primary/helpers/httpErrors";
import { AppSpan, tracer } from "../../adapters/primary/scripts/tracing";
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
    const result = await tracer.startActiveSpan(
      `Use Case`,
      traceUseCaseWithContext(() => this._execute(validParams, jwtPayload), {
        useCaseName,
        input: validParams,
        jwtPayload,
      }),
    );

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

    return this.uowPerformer
      .perform((uow) => this._execute(validParams, uow, jwtPayload))
      .catch((error) => {
        logger.error(
          `UseCase execution Errored - ${useCaseName} : ${error.message}`,
        );
        throw error;
      })
      .finally(() => {
        logger.info(`UseCase execution Finished - ${useCaseName}`);
      });
  }

  protected abstract _execute(
    params: Input,
    uow: UnitOfWork,
    jwtPayload?: JWTPayload,
  ): Promise<Output>;
}

const traceUseCaseWithContext =
  <Input, JWTPayload, Output>(
    cb: () => Promise<Output>,
    context: { useCaseName: string; input: Input; jwtPayload: JWTPayload },
  ) =>
  async (span: AppSpan) => {
    span.setAttributes({
      _useCaseName: context.useCaseName,
      input: JSON.stringify(context.input),
      jwtPayload: JSON.stringify(context.jwtPayload),
    });

    return cb()
      .then((output) => {
        span.setAttribute("output", JSON.stringify(output));
        return output;
      })
      .catch((error) => {
        span.setAttribute("error", JSON.stringify(error));
        throw error;
      })
      .finally(() => span.end());
  };
