import { z } from "zod";
import { BadRequestError } from "../../adapters/primary/helpers/sendHttpResponse";
import { MagicLinkPayload } from "../../shared/tokens/MagicLinkPayload";

export abstract class UseCase<Input, Output = void> {
  protected abstract inputSchema: z.ZodSchema<Input>;

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

    return this._execute(validParams, jwtPayload);
  }

  // this method is guaranteed to only receive validated params
  protected abstract _execute(
    params: Input,
    jwtPayload?: MagicLinkPayload,
  ): Promise<Output>;
}
