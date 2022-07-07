import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryReportingGateway } from "../../../adapters/secondary/reporting/InMemoryReportingGateway";
import {
  ConventionReadyForExport,
  ExportConventionsReport,
} from "../../../domain/convention/useCases/ExportConventionsReport";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { reasonableSchedule } from "shared/src/schedule/ScheduleUtils";
import { InMemoryConventionQueries } from "../../../adapters/secondary/InMemoryConventionQueries";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import {
  ArchivedReport,
  ConventionExportByAgency,
} from "../../../domain/core/ports/ReportingGateway";

describe("ExportConventionsReport", () => {
  it("exports the conventions grouped by agencies in the reporting gateway", async () => {
    const { useCase, reportingGateway, conventionRepository } =
      prepareUseCase();
    // Prepare
    conventionRepository._conventions = {
      "id-immersion-agency-nantes": new ConventionDtoBuilder()
        .withId("id-immersion-agency-nantes")
        .withAgencyId("nantes")
        .withSchedule(reasonableSchedule)
        .build(),
      "id-immersion-agency-lyon": new ConventionDtoBuilder()
        .withId("id-immersion-agency-lyon")
        .withAgencyId("lyon")
        .withSchedule(reasonableSchedule)
        .build(),
      "id2-immersion-agency-lyon": new ConventionDtoBuilder()
        .withId("id2-immersion-agency-lyon")
        .withAgencyId("lyon")
        .withSchedule(reasonableSchedule)
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
  it("validate export contract", async () => {
    // Prepare
    const { useCase, reportingGateway, conventionRepository } =
      prepareUseCase();

    conventionRepository._conventions = {
      "id-immersion-agency-nantes": new ConventionDtoBuilder()
        .withId("id-immersion-agency-nantes")
        .withAgencyId("nantes")
        .withFederatedIdentity("peConnect:uuid-personne-pe-connectee")
        .withSchedule(reasonableSchedule)
        .build(),
    };

    // Act
    await useCase.execute("/some/archive/path");

    // Assert
    const expectedConventionReadyForExport: ConventionReadyForExport = {
      agencyName: "TEST_AGENCY_NAME_WITH_ID_nantes",
      beneficiaryAccepted: "OUI",
      businessName: "Beta.gouv.fr",
      dateEnd: "2021-01-15T00:00:00.000Z",
      dateStart: "2021-01-06T00:00:00.000Z",
      dateSubmission: "2021-01-04T00:00:00.000Z",
      email: "beneficiary@email.fr",
      emergencyContact: "Clariss Ocon",
      emergencyContactPhone: "0663567896",
      enterpriseAccepted: "OUI",
      firstName: "Esteban",
      formatedDateEnd: "2021-01-15",
      formatedDateStart: "2021-01-06",
      formatedDateSubmission: "2021-01-04",
      immersionObjective: "Confirmer un projet professionnel",
      immersionProfession: "Pilote de machines d'abattage",
      lastName: "Ocon",
      mentor: "Alain Prost",
      mentorEmail: "establishment@example.com",
      mentorPhone: "0601010101",
      phone: "+33012345678",
      postalCode: "75001",
      siret: "12345678901234",
      status: "Brouillon",
      totalHours: 70,
      weeklyHours: [35, 35],
      workConditions: undefined,
      planning: `mercredi 06/01/2021 : 08:00-12:00, 13:00-16:00
jeudi 07/01/2021 : 08:00-12:00, 13:00-16:00
vendredi 08/01/2021 : 08:00-12:00, 13:00-16:00
samedi 09/01/2021 : 08:00-12:00, 13:00-16:00
dimanche 10/01/2021 : 08:00-12:00, 13:00-16:00
lundi 11/01/2021 : 08:00-12:00, 13:00-16:00
mardi 12/01/2021 : 08:00-12:00, 13:00-16:00
mercredi 13/01/2021 : 08:00-12:00, 13:00-16:00
jeudi 14/01/2021 : 08:00-12:00, 13:00-16:00
vendredi 15/01/2021 : 08:00-12:00, 13:00-16:00`,
      formatedFederatedIdentity: "peExternalId:uuid-personne-pe-connectee",
    };
    const report: ConventionExportByAgency = {
      TEST_AGENCY_NAME_WITH_ID_nantes: [expectedConventionReadyForExport],
    };
    const expectedReport: ArchivedReport<ConventionExportByAgency> = {
      report,
      archivePath: "/some/archive/path",
    };
    expect(reportingGateway.expectedReport).toEqual(expectedReport);
  });
});

const prepareUseCase = () => {
  const reportingGateway = new InMemoryReportingGateway();
  const conventionRepository = new InMemoryConventionRepository();
  const conventionQueries = new InMemoryConventionQueries(conventionRepository);
  const uowPerformer = new InMemoryUowPerformer({
    ...createInMemoryUow(),
    reportingGateway,
    conventionQueries,
  });
  const useCase = new ExportConventionsReport(uowPerformer);
  return { useCase, reportingGateway, conventionRepository };
};
