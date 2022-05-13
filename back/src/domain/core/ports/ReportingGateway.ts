import { ImmersionApplicationReadyForExportVO } from "../../immersionApplication/valueObjects/ImmersionApplicationReadyForExportVO";

export type ArchivedReport<T> = {
  report: T;
  archivePath: string;
};
export type ImmersionApplicationsExportByAgency = Record<
  string,
  ImmersionApplicationReadyForExportVO[]
>;
export interface ReportingGateway {
  exportImmersionApplications(
    report: ArchivedReport<ImmersionApplicationsExportByAgency>,
  ): Promise<void>;
}
