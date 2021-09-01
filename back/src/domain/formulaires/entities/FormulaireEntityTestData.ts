import { FormulaireDto, FormulaireStatus } from "../../../shared/FormulaireDto";

export const DEMANDE_IMMERSION_ID = "test_demande_immersion_id";
export const VALID_EMAILS = ["valid@email.fr", "name@example.com"];
export const DATE_SUBMISSION = "2021-01-01";
export const DATE_START = "2021-01-03";
export const DATE_END = "2021-01-15";
export const VALID_PHONES = [
  "+33012345678",
  "0601010101",
  "+18001231234",
  "+41800001853",
];

export const validFormulaire: FormulaireDto = {
  id: DEMANDE_IMMERSION_ID,
  status: FormulaireStatus.DRAFT,
  email: VALID_EMAILS[0],
  phone: VALID_PHONES[0],
  firstName: "Esteban",
  lastName: "Ocon",
  dateSubmission: DATE_SUBMISSION,
  dateStart: DATE_START,
  dateEnd: DATE_END,
  businessName: "Beta.gouv.fr",
  siret: "01234567890123",
  mentor: "Alain Prost",
  mentorPhone: VALID_PHONES[1],
  mentorEmail: VALID_EMAILS[1],
  workdays: ["jeudi", "vendredi", "samedi", "dimanche"],
  workHours: "9h00-17h00",
  immersionAddress: "",
  individualProtection: true,
  sanitaryPrevention: true,
  sanitaryPreventionDescription: "fourniture de gel",
  immersionObjective: "Confirmer un projet professionnel",
  immersionProfession: "Pilote d'automobile",
  immersionActivities: "Piloter un automobile",
  immersionSkills: "Utilisation des pneus optimale, gestion de carburant",
  beneficiaryAccepted: true,
  enterpriseAccepted: true,
} as FormulaireDto;
