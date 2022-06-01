import { ConventionReadyForExportVO } from "../../convention/valueObjects/ConventionReadyForExportVO";

export type ArchivedReport<T> = {
  report: T;
  archivePath: string;
};
export type ConventionExportByAgency = Record<
  string,
  ConventionReadyForExportVO[]
>;
export interface ReportingGateway {
  exportConventions(
    report: ArchivedReport<ConventionExportByAgency>,
  ): Promise<void>;
}
