import { ConventionReadyForExport } from "../../convention/useCases/ExportConventionsReport";

export type ArchivedReport<T> = {
  report: T;
  archivePath: string;
};
export type ConventionExportByAgency = Record<
  string,
  ConventionReadyForExport[]
>;
export interface ReportingGateway {
  exportConventions(
    report: ArchivedReport<ConventionExportByAgency>,
  ): Promise<void>;
}
