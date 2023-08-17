import { AgencyModifierRole, ConventionDto, Role, SignatoryRole } from "shared";

type ConventionRequireModificationCommon = {
  convention: ConventionDto;
  justification: string;
  requesterRole: Role;
};
export type AgencyActorRequestModificationPayload =
  ConventionRequireModificationCommon & {
    modifierRole: AgencyModifierRole;
    agencyActorEmail: string;
  };
export type SignatoryRequestModificationPayload =
  ConventionRequireModificationCommon & {
    modifierRole: SignatoryRole;
  };
export type ConventionRequiresModificationPayload =
  | AgencyActorRequestModificationPayload
  | SignatoryRequestModificationPayload;
