export type GenericExportable<N extends string, K extends string> = {
  name: N;
  filters: Partial<Record<K, unknown>>;
  keyToGroupBy?: K;
};

export type ExportableName = GetExportableParams["name"];

export type GetExportableParams =
  | EstablishmentsWithAggregatedOffersExportableParams
  | EstablishmentsWithFlattenOffersExportableParams;

export type EstablishmentsWithAggregatedOffersExportableParams =
  GenericExportable<
    "establishments_with_aggregated_offers",
    "Origine" | "Division NAF" | "Département" | "Région"
  >;

export type EstablishmentsWithFlattenOffersExportableParams = GenericExportable<
  "establishments_with_flatten_offers",
  "Origine" | "Division NAF" | "Département" | "Région"
>;

export type ExportDataDto = {
  fileName: string;
  exportableParams: GetExportableParams;
};
