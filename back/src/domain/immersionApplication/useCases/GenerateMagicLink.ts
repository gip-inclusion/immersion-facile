import { createMagicLinkPayload } from "../../../shared/tokens/MagicLinkPayload";
import { GenerateMagicLinkJwt } from "../../auth/jwt";
import { UseCase } from "../../core/UseCase";
import {
  GenerateMagicLinkRequestDto,
  GenerateMagicLinkResponseDto,
} from "../../../shared/ImmersionApplication/ImmersionApplication.dto";
import { generateMagicLinkRequestSchema } from "../../../shared/ImmersionApplication/immersionApplication.schema";

export class GenerateMagicLink extends UseCase<
  GenerateMagicLinkRequestDto,
  GenerateMagicLinkResponseDto
> {
  constructor(private readonly generateMagicLinkJwt: GenerateMagicLinkJwt) {
    super();
  }

  inputSchema = generateMagicLinkRequestSchema;

  //eslint-disable-next-line @typescript-eslint/require-await
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
          "backoffice administrator",
          1,
          undefined,
          undefined,
          twoDaysAgo,
        )
      : createMagicLinkPayload(applicationId, role, "backoffice administrator");
    return {
      jwt: this.generateMagicLinkJwt(payload),
    };
  }
}
