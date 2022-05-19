import { FormEstablishmentSourceInUrl } from "../formEstablishment/FormEstablishment.dto";

export type DepartmentOrRegion = "region" | "department";

export type FormSourceProvider = FormEstablishmentSourceInUrl | "all";

export type EstablishmentExportConfigDto = {
  groupKey: DepartmentOrRegion;
  aggregateProfession: boolean;
  sourceProvider: FormSourceProvider;
};
