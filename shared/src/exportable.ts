export type GenericExportable<N extends string, K extends string> = {
  name: N;
  filters: Partial<Record<K, unknown>>;
  keyToGroupBy?: K;
};

export type ExportableName = GetExportableParams["name"];

export type GetExportableParams =
  | EstablishmentsWithAggregatedOffersExportableParams
  | EstablishmentsWithFlattenOffersExportableParams
  | ConventionsExportableParams
  | AgenciesExportableParams
  | ContactRequestsExportableParams;

export type EstablishmentsWithAggregatedOffersExportableParams =
  GenericExportable<
    "establishments_with_aggregated_offers",
    "Origine" | "Division NAF" | "Département" | "Région"
  >;

export type EstablishmentsWithFlattenOffersExportableParams = GenericExportable<
  "establishments_with_flatten_offers",
  "Origine" | "Division NAF" | "Département" | "Région"
>;

export type AgenciesExportableParams = GenericExportable<
  "agencies",
  "Département" | "Région" | "Statut" | "Type"
>;

export type ConventionsExportableParams = GenericExportable<
  "conventions",
  | "Département de la structure"
  | "Région de la structure"
  | "Statut"
  | "Structure"
  | "Type de structure"
>;

export type ContactRequestsExportableParams = GenericExportable<
  "contact_requests",
  "Région" | "Département"
>;

export type ExportDataDto = {
  fileName: string;
  exportableParams: GetExportableParams;
};
