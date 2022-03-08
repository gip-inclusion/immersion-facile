import { AgencyId, CreateAgencyConfig } from "../../../shared/agencies";
import { LatLonDto } from "../../../shared/SearchImmersionDto";
import { RequireField } from "../../../shared/utils";

export type AgencyStatus = "active" | "closed" | "needsReview";

export type AgencyConfig = RequireField<
  CreateAgencyConfig,
  "questionnaireUrl"
> & {
  status: AgencyStatus;
  adminEmails: string[];
};

export interface AgencyRepository {
  insert: (config: AgencyConfig) => Promise<AgencyId | undefined>;
  getById: (id: AgencyId) => Promise<AgencyConfig | undefined>;
  getNearby: (position: LatLonDto) => Promise<AgencyConfig[]>;
  getAllActive: () => Promise<AgencyConfig[]>;
}
