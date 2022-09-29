import {
  createConventionMagicLinkPayload,
  GenerateMagicLinkRequestDto,
  generateMagicLinkRequestSchema,
  GenerateMagicLinkResponseDto,
} from "shared";
import { GenerateMagicLinkJwt } from "../../auth/jwt";
import { UseCase } from "../../core/UseCase";

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
      ? createConventionMagicLinkPayload(
          applicationId,
          role,
          "backoffice administrator",
          1,
          undefined,
          undefined,
          twoDaysAgo,
        )
      : createConventionMagicLinkPayload(
          applicationId,
          role,
          "backoffice administrator",
        );
    return {
      jwt: this.generateMagicLinkJwt(payload),
    };
  }
}
