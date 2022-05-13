import {
  ArchivedReport,
  ImmersionApplicationsExportByAgency,
  ReportingGateway,
} from "../../../domain/core/ports/ReportingGateway";

export class InMemoryReportingGateway implements ReportingGateway {
  exportImmersionApplications(
    report: ArchivedReport<ImmersionApplicationsExportByAgency>,
  ): Promise<void> {
    this.expectedReport = report;
    return Promise.resolve();
  }
  public expectedReport:
    | ArchivedReport<ImmersionApplicationsExportByAgency>
    | undefined = undefined;
}
