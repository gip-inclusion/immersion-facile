import {
  ApplicationSource,
  DemandeImmersionDto,
  DemandeImmersionId,
} from "../shared/DemandeImmersionDto";
import { reasonableSchedule } from "../shared/ScheduleSchema";
import { Builder } from "./Builder";

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

const validDemandeImmersion: DemandeImmersionDto = {
  id: DEMANDE_IMMERSION_ID,
  status: "DRAFT",
  source: "GENERIC",
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
  schedule: reasonableSchedule,
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
};

export class DemandeImmersionDtoBuilder
  implements Builder<DemandeImmersionDto>
{
  constructor(private dto: DemandeImmersionDto = validDemandeImmersion) {}

  public withEmail(email: string): DemandeImmersionDtoBuilder {
    return new DemandeImmersionDtoBuilder({ ...this.dto, email });
  }

  public withMentorEmail(mentorEmail: string): DemandeImmersionDtoBuilder {
    return new DemandeImmersionDtoBuilder({ ...this.dto, mentorEmail });
  }

  public withDateSubmission(
    dateSubmission: string
  ): DemandeImmersionDtoBuilder {
    return new DemandeImmersionDtoBuilder({ ...this.dto, dateSubmission });
  }

  public withDateStart(dateStart: string): DemandeImmersionDtoBuilder {
    return new DemandeImmersionDtoBuilder({ ...this.dto, dateStart });
  }

  public withDateEnd(dateEnd: string): DemandeImmersionDtoBuilder {
    return new DemandeImmersionDtoBuilder({ ...this.dto, dateEnd });
  }

  public withId(id: DemandeImmersionId): DemandeImmersionDtoBuilder {
    return new DemandeImmersionDtoBuilder({ ...this.dto, id });
  }

  public withSource(source: ApplicationSource): DemandeImmersionDtoBuilder {
    return new DemandeImmersionDtoBuilder({ ...this.dto, source });
  }

  public build() {
    return this.dto;
  }
}
