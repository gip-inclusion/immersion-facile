import { AgencyDto } from "shared";
import { AuthenticatedUser } from "shared";

export type AgencyRole = "counsellor" | "validator" | "agencyOwner";

export type AgencyRight = {
  agency: AgencyDto;
  role: AgencyRole | "toReview";
};

export type InclusionConnectedUser = AuthenticatedUser & {
  agencyRights: AgencyRight[];
};
