import type { DepartmentCode } from "../address/address.dto";
import type { AgencyId } from "../agency/agency.dto";
import type { SiretDto } from "../siret/siret";

type AgencyGroupCommon = {
  siret: SiretDto;
  name: string;
  email: string | null;
  ccEmails: string[] | null;
  agencyIds: AgencyId[];
};

export type AgencyGroupScope = "direction-territoriale" | "direction-régionale";

type AgencyGroupFranceTravail = {
  kind: "france-travail";
  scope: "direction-territoriale" | "direction-régionale";
  codeSafir: string;
  departments: DepartmentCode[];
};

export type AgencyGroup = AgencyGroupCommon & AgencyGroupFranceTravail;
