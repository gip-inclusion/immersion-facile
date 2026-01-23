import * as Sentry from "@sentry/node";
import type { ZodSchemaWithInputMatchingOutput } from "shared";
import type { z } from "zod";
import { createLogger } from "../../utils/logger";
import type { UnitOfWork } from "./unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "./unit-of-work/ports/UnitOfWorkPerformer";
import {
  type UseCaseIdentityPayload,
  useCaseLoggerWrapper,
  validateUseCaseInput,
} from "./useCase.helpers";

const logger = createLogger(__filename);

export abstract class UseCase<
  Input,
  Output = void,
  P extends UseCaseIdentityPayload = void,
> {
  protected abstract inputSchema: ZodSchemaWithInputMatchingOutput<Input>;

  // this method is guaranteed to only receive validated params
  protected abstract _execute(
    params: Input,
    jwtPayload?: UseCaseIdentityPayload,
  ): Promise<Output>;

  // this methode should not be overwritten, implement _execute instead
  public async execute(input: Input, payload?: P): Promise<Output> {
    const useCaseName = this.constructor.name;

    return useCaseLoggerWrapper({
      useCaseName,
      startDate: new Date(),
      logger,
      validInput: validateUseCaseInput({
        input,
        inputSchema: this.inputSchema,
        logger,
        useCaseName,
      }),
      identityPayload: payload,
      cb: ({ useCaseName, validInput, identityPayload }) =>
        Sentry.startSpan({ name: useCaseName }, () =>
          this._execute(validInput, identityPayload),
        ),
    });
  }
}

export abstract class TransactionalUseCase<
  Input,
  Output = void,
  P extends UseCaseIdentityPayload = void,
> {
  protected abstract inputSchema: z.ZodType<Input, any>;

  public constructor(private uowPerformer: UnitOfWorkPerformer) {}

  protected abstract _execute(
    params: Input,
    uow: UnitOfWork,
    jwtPayload?: P,
  ): Promise<Output>;

  // this method should not be overwritten, implement _execute instead
  public async execute(input: Input, payload?: P): Promise<Output> {
    const useCaseName = this.constructor.name;

    return useCaseLoggerWrapper({
      useCaseName,
      startDate: new Date(),
      logger,
      validInput: validateUseCaseInput({
        useCaseName,
        input,
        inputSchema: this.inputSchema,
        logger,
      }),
      identityPayload: payload,
      cb: ({ useCaseName, validInput, identityPayload }) =>
        this.uowPerformer.perform((uow) =>
          Sentry.startSpan({ name: useCaseName }, () =>
            this._execute(validInput, uow, identityPayload),
          ),
        ),
    });
  }
}
