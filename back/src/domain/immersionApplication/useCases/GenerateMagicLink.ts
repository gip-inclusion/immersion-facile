import {
  GenerateMagicLinkRequestDto,
  GenerateMagicLinkResponseDto,
} from "../../../shared/ImmersionApplicationDto";
import { createMagicLinkPayload } from "../../../shared/tokens/MagicLinkPayload";
import { GenerateJwtFn } from "../../auth/jwt";
import { UseCase } from "../../core/UseCase";

export class GenerateMagicLink
  implements UseCase<GenerateMagicLinkRequestDto, GenerateMagicLinkResponseDto>
{
  constructor(private readonly generateJwtFn: GenerateJwtFn) {}

  public async execute({ applicationId, role }: GenerateMagicLinkRequestDto) {
    return {
      jwt: this.generateJwtFn(createMagicLinkPayload(applicationId, role)),
    };
  }
}
