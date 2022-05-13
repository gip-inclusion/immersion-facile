import { ImmersionApplicationRawBeforeExportVO } from "../../domain/immersionApplication/valueObjects/ImmersionApplicationRawBeforeExportVO";
import { expectToEqual } from "../../../../shared/src/expectToEqual";

describe("ImmersionApplicationRawBeforeExportVO", () => {
  describe("BUG - with production data that have total hours to 0 on excel reports (usecase has tech coupling)", () => {
    it("exclude business logic - return 140 before making excel part", () => {
      const immersionApplicationRawBeforeExportVO =
        new ImmersionApplicationRawBeforeExportVO({
          agencyName: "agency name from agencyId",
          status: "ACCEPTED_BY_VALIDATOR",
          email: "axxxxx@xxxxxx.fr",
          firstName: "A.",
          lastName: "S.",
          phone: "0600000000",
          postalCode: "11111",
          dateSubmission: "06/04/2022",
          dateStart: "2022-04-11",
          dateEnd: "2022-05-08",
          siret: "75045487000000",
          businessName: "L'xxxxxxx",
          mentor: "R. B., Gerant",
          mentorPhone: "0200000000",
          mentorEmail: "rxxxxxx@xxxxxxx.fr",
          schedule: {
            isSimple: false,
            selectedIndex: 0,
            simpleSchedule: {
              hours: [
                { end: "12:30", start: "08:00" },
                { end: "16:30", start: "14:00" },
              ],
              dayPeriods: [[0, 4]],
            },
            complexSchedule: [
              [
                { end: "12:30", start: "08:00" },
                { end: "16:30", start: "14:00" },
              ],
              [
                { end: "12:30", start: "08:00" },
                { end: "16:30", start: "14:00" },
              ],
              [
                { end: "12:30", start: "08:00" },
                { end: "16:30", start: "14:00" },
              ],
              [
                { end: "12:30", start: "08:00" },
                { end: "16:30", start: "14:00" },
              ],
              [
                { end: "12:30", start: "08:00" },
                { end: "16:30", start: "14:00" },
              ],
              [],
              [],
            ],
          },
          immersionObjective: "Confirmer un projet professionnel",
          immersionProfession: "Vendeur / Vendeuse buraliste",
          beneficiaryAccepted: true,
          enterpriseAccepted: true,
          peExternalId: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
          workConditions: "Retour au domicile chaque jours",
        });
      expectToEqual(
        immersionApplicationRawBeforeExportVO.toImmersionApplicationReadyForExportVO()
          .totalHours,
        140,
      );
    });
  });
});
