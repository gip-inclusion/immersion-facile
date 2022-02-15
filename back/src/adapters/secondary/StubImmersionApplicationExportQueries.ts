import { ImmersionApplicationExportQueries } from "../../domain/immersionApplication/ports/ImmersionApplicationExportQueries";
import { ImmersionApplicationRawBeforeExportVO } from "../../domain/immersionApplication/valueObjects/ImmersionApplicationRawBeforeExportVO";

export const StubImmersionApplicationExportQueries: ImmersionApplicationExportQueries =
  {
    getAllApplicationsForExport: async () => [
      new ImmersionApplicationRawBeforeExportVO({
        agencyName: "agency name from agencyId",
        status: "READY_TO_SIGN",
        email: "sylvanie@monemail.fr",
        firstName: "Sylvanie",
        lastName: "Durand",
        phone: "0612345678",
        postalCode: "75001",
        dateSubmission: "2022-02-11",
        dateStart: "2022-02-15",
        dateEnd: "2022-02-22",
        siret: "12345678901234",
        businessName: "MA P'TITE BOITE",
        mentor: "Le Mentor du futur",
        mentorPhone: "0101100110",
        mentorEmail: "mentor@supermentor.fr",
        schedule: {
          isSimple: true,
          selectedIndex: 0,
          complexSchedule: [
            [
              { start: "08:00", end: "12:00" },
              { start: "13:00", end: "16:00" },
            ],
            [
              { start: "08:00", end: "12:00" },
              { start: "13:00", end: "16:00" },
            ],
            [
              { start: "08:00", end: "12:00" },
              { start: "13:00", end: "16:00" },
            ],
            [
              { start: "08:00", end: "12:00" },
              { start: "13:00", end: "16:00" },
            ],
            [
              { start: "08:00", end: "12:00" },
              { start: "13:00", end: "16:00" },
            ],
            [],
            [],
          ],
          simpleSchedule: {
            dayPeriods: [[0, 4]],
            hours: [
              { start: "08:00", end: "12:00" },
              { start: "13:00", end: "16:00" },
            ],
          },
        },
        immersionObjective: "",
        immersionProfession: "Boulanger / Boulangère",
        beneficiaryAccepted: false,
        enterpriseAccepted: false,
      }),
    ],
  };
