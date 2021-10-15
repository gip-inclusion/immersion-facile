import { ImmersionApplicationId } from "../../../../shared/ImmersionApplicationDto";
import { Role } from "../../../../shared/tokens/MagicLinkPayload";

export type GenerateMagicLinkFn = (
  applicationId: ImmersionApplicationId,
  role: Role,
) => string;
