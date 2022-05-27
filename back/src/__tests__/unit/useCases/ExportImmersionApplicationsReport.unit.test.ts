import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryReportingGateway } from "../../../adapters/secondary/reporting/InMemoryReportingGateway";

import { ExportImmersionApplicationsReport } from "../../../domain/immersionApplication/useCases/ExportImmersionApplicationsReport";

import { InMemoryImmersionApplicationQueries } from "../../../adapters/secondary/InMemoryImmersionApplicationQueries";
import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";

const prepareUseCase = () => {
  const reportingGateway = new InMemoryReportingGateway();
  const immersionApplicationRepo = new InMemoryImmersionApplicationRepository();
  const immersionApplicationQueries = new InMemoryImmersionApplicationQueries(
    immersionApplicationRepo,
  );
  const uowPerformer = new InMemoryUowPerformer({
    ...createInMemoryUow(),
    reportingGateway,
    immersionApplicationQueries,
  });
  const useCase = new ExportImmersionApplicationsReport(uowPerformer);

  return { useCase, reportingGateway, immersionApplicationRepo };
};
describe("ExportImmersionApplicationsReport", () => {
  it("exports the immersion application grouped by agencies in the reporting gateway", async () => {
    const { useCase, reportingGateway, immersionApplicationRepo } =
      prepareUseCase();
    // Prepare
    immersionApplicationRepo._immersionApplications = {
      "id-immersion-agency-nantes": new ImmersionApplicationEntityBuilder()
        .withId("id-immersion-agency-nantes")
        .withAgencyId("nantes")
        .build(),
      "id-immersion-agency-lyon": new ImmersionApplicationEntityBuilder()
        .withId("id-immersion-agency-lyon")
        .withAgencyId("lyon")
        .build(),
      "id2-immersion-agency-lyon": new ImmersionApplicationEntityBuilder()
        .withId("id2-immersion-agency-lyon")
        .withAgencyId("lyon")
        .build(),
    };
    // Act
    await useCase.execute("/some/archive/path");

    // Assert
    expect(reportingGateway.expectedReport?.archivePath).toBe(
      "/some/archive/path",
    );
    const reportInGateway = reportingGateway.expectedReport!.report;
    expect(Object.keys(reportInGateway)).toHaveLength(2);
    expect(
      Object.keys(reportInGateway["TEST_AGENCY_NAME_WITH_ID_nantes"]),
    ).toHaveLength(1);
    expect(
      Object.keys(reportInGateway["TEST_AGENCY_NAME_WITH_ID_lyon"]),
    ).toHaveLength(2);
  });
});
