import { ConventionDto, Role } from "shared";

export type ConventionRequiresModificationPayload = {
  convention: ConventionDto;
  justification: string;
  roles: Role[];
};
