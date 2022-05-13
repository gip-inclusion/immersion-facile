import { ImmersionApplicationExportQueries } from "../../domain/immersionApplication/ports/ImmersionApplicationExportQueries";
import { ImmersionApplicationRawBeforeExportVO } from "../../domain/immersionApplication/valueObjects/ImmersionApplicationRawBeforeExportVO";
import { optional } from "./pg/pgUtils";

export const PROD_PG_0_HOUR_EXEMPLE = new ImmersionApplicationRawBeforeExportVO(
  {
    agencyName: "Pôle emploi d'Angers La Roseraie",
    status: "ACCEPTED_BY_VALIDATOR",
    postalCode: "49320",
    email: "amel.49@hotmail.fr",
    phone: "0772204577",
    firstName: "Amelie",
    lastName: "Simon",
    emergencyContact: undefined,
    emergencyContactPhone: undefined,
    dateSubmission: new Date("2022-04-06 00:00:00+00").toISOString(),
    dateStart: new Date("2022-04-11 00:00:00+00").toISOString(),
    dateEnd: new Date("2022-05-08 00:00:00+00").toISOString(),
    businessName: "L'ESCALE",
    mentor: "Raphaël Besnard, Gerant",
    mentorPhone: "0241804098",
    mentorEmail: "raphaealbesnard@yahoo.fr",
    immersionObjective: "Confirmer un projet professionnel",
    immersionProfession: "Vendeur / Vendeuse buraliste",
    beneficiaryAccepted: Boolean(1).valueOf(),
    enterpriseAccepted: Boolean(1).valueOf(),
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
    siret: "75045487800018",
    workConditions: optional("Retour au domicile chaque jours"),
  },
);
export const PROD_MIX_PG_EXCEL_140_HOUR_EXEMPLE =
  new ImmersionApplicationRawBeforeExportVO({
    dateSubmission: new Date("2022-04-06").toISOString(),
    dateStart: new Date("2022-04-11").toISOString(),
    dateEnd: new Date("2022-05-08").toISOString(),
    agencyName: "140_Hour_Exemple",
    status: "ACCEPTED_BY_VALIDATOR",
    email: "amel.49@hotmail.fr",
    emergencyContact: undefined,
    emergencyContactPhone: undefined,
    firstName: "Amelie",
    lastName: "Simon",
    phone: "0772204577",
    postalCode: "49320",
    siret: "75045487800018",
    businessName: "L'ESCALE",
    mentor: "Raphaël Besnard, Gerant",
    mentorPhone: "0241804098",
    mentorEmail: "raphaealbesnard@yahoo.fr",
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
    workConditions: "Retour au domicile chaque jours",
  });

const FIRST_EXEMPLE = new ImmersionApplicationRawBeforeExportVO({
  agencyName: "agency name from agencyId",
  status: "READY_TO_SIGN",
  email: "sylvanie@monemail.fr",
  firstName: "Sylvanie",
  lastName: "Durand",
  phone: "0612345678",
  postalCode: "75001",
  dateSubmission: new Date("2022-02-11").toISOString(),
  dateStart: new Date("2022-02-15").toISOString(),
  dateEnd: new Date("2022-02-22").toISOString(),
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

  workConditions: "Conditions de travail particulière : repas non fournis",
});
export const StubImmersionApplicationExportQueries: ImmersionApplicationExportQueries =
  {
    getAllApplicationsForExport: async () => [
      PROD_MIX_PG_EXCEL_140_HOUR_EXEMPLE,
      FIRST_EXEMPLE,
      PROD_PG_0_HOUR_EXEMPLE,
    ],
  };
