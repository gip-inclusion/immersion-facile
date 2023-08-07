import { ConventionDto, ModifierRole, Role } from "shared";

export type ConventionRequiresModificationPayload = {
  convention: ConventionDto;
  justification: string;
  role: Role;
  modifierRole: ModifierRole;
};
