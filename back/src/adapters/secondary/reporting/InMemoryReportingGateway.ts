import {
  ArchivedReport,
  ConventionExportByAgency,
  ReportingGateway,
} from "../../../domain/core/ports/ReportingGateway";

export class InMemoryReportingGateway implements ReportingGateway {
  async exportConventions(
    report: ArchivedReport<ConventionExportByAgency>,
  ): Promise<void> {
    this.expectedReport = report;
  }
  public expectedReport: ArchivedReport<ConventionExportByAgency> | undefined =
    undefined;
}
