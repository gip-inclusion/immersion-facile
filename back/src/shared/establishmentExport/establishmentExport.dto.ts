export type DepartmentOrRegion = "region" | "department";

export type EstablishmentExportConfigDto = {
  groupKey: DepartmentOrRegion;
  aggregateProfession: boolean;
};
