import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryReportingGateway } from "../../../adapters/secondary/reporting/InMemoryReportingGateway";
import {
  PROD_MIX_PG_EXCEL_140_HOUR_EXEMPLE,
  PROD_PG_0_HOUR_EXEMPLE,
} from "../../../adapters/secondary/StubImmersionApplicationExportQueries";
import {
  ArchivedReport,
  ImmersionApplicationsExportByAgency,
} from "../../../domain/core/ports/ReportingGateway";

import { ExportImmersionApplicationsReport } from "../../../domain/immersionApplication/useCases/ExportImmersionApplicationsReport";

import { expectTypeToMatchAndEqual } from "../../../_testBuilders/test.helpers";

describe("ExportImmersionApplicationsReport", () => {
  let uowPerformer: InMemoryUowPerformer;
  let reportingGateway: InMemoryReportingGateway;
  let exportImmersionApplicationsReportUseCase: ExportImmersionApplicationsReport;

  beforeEach(() => {
    reportingGateway = new InMemoryReportingGateway();
    uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      reportingGateway,
    });
    exportImmersionApplicationsReportUseCase =
      new ExportImmersionApplicationsReport(uowPerformer);
  });

  it("save the agency in repo, with the default admin mail and the status to be reviewed", async () => {
    const expectedReport: ArchivedReport<ImmersionApplicationsExportByAgency> =
      {
        report: {
          "agency-name-from-agencyId": [
            {
              agencyName: "agency-name-from-agencyId",
              beneficiaryAccepted: "NON",
              businessName: "MA P'TITE BOITE",
              dateEnd: new Date("2022-02-22").toISOString(),
              formatedDateEnd: "2022-02-22",
              dateStart: new Date("2022-02-15").toISOString(),
              formatedDateStart: "2022-02-15",
              dateSubmission: new Date("2022-02-11").toISOString(),
              formatedDateSubmission: "2022-02-11",
              email: "sylvanie@monemail.fr",
              enterpriseAccepted: "NON",
              firstName: "Sylvanie",
              friday: "08:00-12:00, 13:00-16:00",
              immersionObjective: "",
              immersionProfession: "Boulanger / Boulangère",
              lastName: "Durand",
              mentor: "Le Mentor du futur",
              mentorEmail: "mentor@supermentor.fr",
              mentorPhone: "0101100110",
              monday: "08:00-12:00, 13:00-16:00",
              phone: "0612345678",
              postalCode: "75001",
              saturday: "libre",
              siret: "12345678901234",
              status: "Prêt à signer",
              sunday: "libre",
              thursday: "08:00-12:00, 13:00-16:00",
              totalHours: 42,
              tuesday: "08:00-12:00, 13:00-16:00",
              wednesday: "08:00-12:00, 13:00-16:00",
              weeklyHours: 35,
              workConditions:
                "Conditions de travail particulière : repas non fournis",
              schedule: {
                isSimple: true,
                selectedIndex: 0,
                simpleSchedule: {
                  dayPeriods: [[0, 4]],
                  hours: [
                    {
                      end: "12:00",
                      start: "08:00",
                    },
                    {
                      end: "16:00",
                      start: "13:00",
                    },
                  ],
                },
                complexSchedule: [
                  [
                    {
                      end: "12:00",
                      start: "08:00",
                    },
                    {
                      end: "16:00",
                      start: "13:00",
                    },
                  ],
                  [
                    {
                      end: "12:00",
                      start: "08:00",
                    },
                    {
                      end: "16:00",
                      start: "13:00",
                    },
                  ],
                  [
                    {
                      end: "12:00",
                      start: "08:00",
                    },
                    {
                      end: "16:00",
                      start: "13:00",
                    },
                  ],
                  [
                    {
                      end: "12:00",
                      start: "08:00",
                    },
                    {
                      end: "16:00",
                      start: "13:00",
                    },
                  ],
                  [
                    {
                      end: "12:00",
                      start: "08:00",
                    },
                    {
                      end: "16:00",
                      start: "13:00",
                    },
                  ],
                  [],
                  [],
                ],
              },
            },
          ],
          [PROD_MIX_PG_EXCEL_140_HOUR_EXEMPLE._props.agencyName]: [
            {
              ...PROD_MIX_PG_EXCEL_140_HOUR_EXEMPLE._props,
              formatedDateEnd: "2022-05-08",
              formatedDateStart: "2022-04-11",
              formatedDateSubmission: "2022-04-06",
              beneficiaryAccepted: "OUI",
              enterpriseAccepted: "OUI",
              status: "Validé par la structure",
              weeklyHours: 35,
              totalHours: 140,
              workConditions: "Retour au domicile chaque jours",
              monday: "08:00-12:30, 14:00-16:30",
              tuesday: "08:00-12:30, 14:00-16:30",
              wednesday: "08:00-12:30, 14:00-16:30",
              thursday: "08:00-12:30, 14:00-16:30",
              friday: "08:00-12:30, 14:00-16:30",
              saturday: "libre",
              sunday: "libre",
            },
          ],
          "Pole-emploi-d'Angers-La-Roseraie": [
            {
              ...PROD_PG_0_HOUR_EXEMPLE._props,
              formatedDateEnd: "2022-05-08",
              formatedDateStart: "2022-04-11",
              formatedDateSubmission: "2022-04-06",
              agencyName: "Pole-emploi-d'Angers-La-Roseraie",
              beneficiaryAccepted: "OUI",
              enterpriseAccepted: "OUI",
              status: "Validé par la structure",
              weeklyHours: 35,
              totalHours: 140,
              workConditions: "Retour au domicile chaque jours",
              monday: "08:00-12:30, 14:00-16:30",
              tuesday: "08:00-12:30, 14:00-16:30",
              wednesday: "08:00-12:30, 14:00-16:30",
              thursday: "08:00-12:30, 14:00-16:30",
              friday: "08:00-12:30, 14:00-16:30",
              saturday: "libre",
              sunday: "libre",
            },
          ],
        },
        archivePath: "path/to/report",
      };
    await exportImmersionApplicationsReportUseCase.execute(
      expectedReport.archivePath,
    );
    expectTypeToMatchAndEqual(reportingGateway.expectedReport, expectedReport);
  });
  it("BUG: compare 0 totalHours PROD_PG and 140 totalHours PROD_MIX_PG", () => {
    expectTypeToMatchAndEqual(PROD_PG_0_HOUR_EXEMPLE._props, {
      ...PROD_MIX_PG_EXCEL_140_HOUR_EXEMPLE._props,
      agencyName: "Pôle emploi d'Angers La Roseraie",
    });
  });
});
