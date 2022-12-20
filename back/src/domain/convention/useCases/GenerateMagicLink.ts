import {
  createConventionMagicLinkPayload,
  GenerateMagicLinkRequestDto,
  generateMagicLinkRequestSchema,
  GenerateMagicLinkResponseDto,
} from "shared";
import { GenerateMagicLinkJwt } from "../../auth/jwt";
import { Clock } from "../../core/ports/Clock";
import { UseCase } from "../../core/UseCase";

export class GenerateMagicLink extends UseCase<
  GenerateMagicLinkRequestDto,
  GenerateMagicLinkResponseDto
> {
  constructor(
    private readonly generateMagicLinkJwt: GenerateMagicLinkJwt,
    private clock: Clock,
  ) {
    super();
  }

  inputSchema = generateMagicLinkRequestSchema;

  //eslint-disable-next-line @typescript-eslint/require-await
  public async _execute({
    applicationId,
    role,
    expired,
  }: GenerateMagicLinkRequestDto) {
    const now = this.clock.now().getTime();
    const twoDaysAgo = Math.round((now - 48 * 3600 * 1000) / 1000);

    const payload = expired
      ? createConventionMagicLinkPayload(
          applicationId,
          role,
          "backoffice administrator",
          1,
          () => now,
          undefined,
          twoDaysAgo,
        )
      : createConventionMagicLinkPayload(
          applicationId,
          role,
          "backoffice administrator",
          undefined,
          () => now,
        );
    return {
      jwt: this.generateMagicLinkJwt(payload),
    };
  }
}
