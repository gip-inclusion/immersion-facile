import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryReportingGateway } from "../../../adapters/secondary/reporting/InMemoryReportingGateway";

import { ExportImmersionApplicationsReport } from "../../../domain/convention/useCases/ExportImmersionApplicationsReport";

import { InMemoryConventionQueries } from "../../../adapters/secondary/InMemoryConventionQueries";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";

const prepareUseCase = () => {
  const reportingGateway = new InMemoryReportingGateway();
  const conventionRepository = new InMemoryConventionRepository();
  const conventionQueries = new InMemoryConventionQueries(conventionRepository);
  const uowPerformer = new InMemoryUowPerformer({
    ...createInMemoryUow(),
    reportingGateway,
    conventionQueries,
  });
  const useCase = new ExportImmersionApplicationsReport(uowPerformer);

  return { useCase, reportingGateway, conventionRepository };
};
describe("ExportImmersionApplicationsReport", () => {
  it("exports the immersion application grouped by agencies in the reporting gateway", async () => {
    const { useCase, reportingGateway, conventionRepository } =
      prepareUseCase();
    // Prepare
    conventionRepository._conventions = {
      "id-immersion-agency-nantes": new ConventionDtoBuilder()
        .withId("id-immersion-agency-nantes")
        .withAgencyId("nantes")
        .build(),
      "id-immersion-agency-lyon": new ConventionDtoBuilder()
        .withId("id-immersion-agency-lyon")
        .withAgencyId("lyon")
        .build(),
      "id2-immersion-agency-lyon": new ConventionDtoBuilder()
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
