import {
  ArchivedReport,
  ImmersionApplicationsExportByAgency,
  ReportingGateway,
} from "../../../domain/core/ports/ReportingGateway";

export class InMemoryReportingGateway implements ReportingGateway {
  async exportImmersionApplications(
    report: ArchivedReport<ImmersionApplicationsExportByAgency>,
  ): Promise<void> {
    this.expectedReport = report;
  }
  public expectedReport:
    | ArchivedReport<ImmersionApplicationsExportByAgency>
    | undefined = undefined;
}
