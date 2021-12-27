import { currentJwtVersion } from "./../../../shared/tokens/MagicLinkPayload";
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
    emailHash,
    expired,
  }: GenerateMagicLinkRequestDto) {
    const twoDaysAgo = Math.round((Date.now() - 48 * 3600 * 1000) / 1000);

    const payload = expired
      ? createMagicLinkPayload(
          applicationId,
          role,
          "backoffice administrator",
          1,
          undefined,
          undefined,
          twoDaysAgo,
        )
      : createMagicLinkPayload(applicationId, role, "backoffice administrator");
    return {
      jwt: this.generateJwtFn(payload),
    };
  }
}
