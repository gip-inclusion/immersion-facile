import { z } from "zod";
import { BadRequestError } from "../../adapters/primary/helpers/httpErrors";
import { MagicLinkPayload } from "../../shared/tokens/MagicLinkPayload";
import { UnitOfWork, UnitOfWorkPerformer } from "./ports/UnitOfWork";

export abstract class UseCase<
  Input,
  Output = void,
  JWTPayload = MagicLinkPayload,
> {
  protected abstract inputSchema: z.ZodSchema<Input>;

  // this methode should not be overwritten, implement _execute instead
  public async execute(
    params: Input,
    jwtPayload?: JWTPayload,
  ): Promise<Output> {
    let validParams: Input;
    try {
      validParams = this.inputSchema.parse(params);
    } catch (e) {
      throw new BadRequestError(e);
    }

    return this._execute(validParams, jwtPayload);
  }

  // this method is guaranteed to only receive validated params
  protected abstract _execute(
    params: Input,
    jwtPayload?: JWTPayload,
  ): Promise<Output>;
}

export abstract class TransactionalUseCase<Input, Output = void> {
  protected abstract inputSchema: z.ZodSchema<Input>;
  protected constructor(private uowPerformer: UnitOfWorkPerformer) {}

  // this methode should not be overwritten, implement _execute instead
  public async execute(
    params: Input,
    jwtPayload?: MagicLinkPayload,
  ): Promise<Output> {
    let validParams: Input;
    try {
      validParams = this.inputSchema.parse(params);
    } catch (e) {
      throw new BadRequestError(e);
    }

    return this.uowPerformer.perform((uow) =>
      this._execute(validParams, uow, jwtPayload),
    );
  }

  protected abstract _execute(
    params: Input,
    uow: UnitOfWork,
    jwtPayload?: MagicLinkPayload,
  ): Promise<Output>;
}
