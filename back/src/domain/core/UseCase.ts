import type { Span } from "@opentelemetry/api";
import { ConventionMagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";
import { z } from "zod";
import {
  BadRequestError,
  validateAndParseZodSchema,
} from "../../adapters/primary/helpers/httpErrors";
import { tracer } from "../../adapters/primary/scripts/tracing";
import { UnitOfWork, UnitOfWorkPerformer } from "./ports/UnitOfWork";

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
    let validParams: Input;
    try {
      validParams = validateAndParseZodSchema(this.inputSchema, params);
    } catch (e) {
      throw new BadRequestError(e);
    }
    return tracer.startActiveSpan(
      `Use Case`,
      traceUseCaseWithContext(() => this._execute(validParams, jwtPayload), {
        useCaseName: this.constructor.name,
        input: validParams,
        jwtPayload,
      }),
    );
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
    const validParams = validateAndParseZodSchema(this.inputSchema, params);
    return tracer.startActiveSpan(
      `Transactional Use Case`,
      traceUseCaseWithContext(
        () =>
          this.uowPerformer.perform((uow) =>
            this._execute(validParams, uow, jwtPayload),
          ),
        {
          useCaseName: this.constructor.name,
          input: validParams,
          jwtPayload,
        },
      ),
    );
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
  async (span: Span) => {
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
