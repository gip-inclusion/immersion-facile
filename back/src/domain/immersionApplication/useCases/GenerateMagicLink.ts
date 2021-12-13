import {
  GenerateMagicLinkRequestDto,
  generateMagicLinkRequestSchema,
  GenerateMagicLinkResponseDto,
} from "../../../shared/ImmersionApplicationDto";
import { createMagicLinkPayload } from "../../../shared/tokens/MagicLinkPayload";
import { GenerateMagicLinkJwt } from "../../auth/jwt";
import { UseCase } from "../../core/UseCase";

export class GenerateMagicLink extends UseCase<
  GenerateMagicLinkRequestDto,
  GenerateMagicLinkResponseDto
> {
  constructor(private readonly generateJwtFn: GenerateMagicLinkJwt) {
    super();
  }

  inputSchema = generateMagicLinkRequestSchema;

  public async _execute({
    applicationId,
    role,
    expired,
  }: GenerateMagicLinkRequestDto) {
    const twoDaysAgo = Math.round((Date.now() - 48 * 3600 * 1000) / 1000);

    const payload = expired
      ? createMagicLinkPayload(
          applicationId,
          role,
          1,
          undefined,
          undefined,
          twoDaysAgo,
        )
      : createMagicLinkPayload(applicationId, role);
    return {
      jwt: this.generateJwtFn(payload),
    };
  }
}
