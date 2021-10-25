import {
  GenerateMagicLinkRequestDto,
  generateMagicLinkRequestSchema,
  GenerateMagicLinkResponseDto,
} from "../../../shared/ImmersionApplicationDto";
import { createMagicLinkPayload } from "../../../shared/tokens/MagicLinkPayload";
import { GenerateJwtFn } from "../../auth/jwt";
import { UseCase } from "../../core/UseCase";

export class GenerateMagicLink extends UseCase<
  GenerateMagicLinkRequestDto,
  GenerateMagicLinkResponseDto
> {
  constructor(private readonly generateJwtFn: GenerateJwtFn) {
    super();
  }

  inputSchema = generateMagicLinkRequestSchema;

  public async _execute({ applicationId, role }: GenerateMagicLinkRequestDto) {
    return {
      jwt: this.generateJwtFn(createMagicLinkPayload(applicationId, role)),
    };
  }
}
