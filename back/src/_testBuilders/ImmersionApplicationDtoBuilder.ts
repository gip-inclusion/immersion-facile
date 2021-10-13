import { AgencyCode } from "../shared/agencies";
import {
  ApplicationSource,
  ApplicationStatus,
  ImmersionApplicationDto,
  ImmersionApplicationId,
} from "../shared/ImmersionApplicationDto";
import {
  LegacyScheduleDto,
  reasonableSchedule,
} from "../shared/ScheduleSchema";
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

const validDemandeImmersion: ImmersionApplicationDto = {
  id: DEMANDE_IMMERSION_ID,
  status: "DRAFT",
  source: "GENERIC",
  agencyCode: "AMIE_BOULONAIS",
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

export class ImmersionApplicationDtoBuilder
  implements Builder<ImmersionApplicationDto>
{
  constructor(private dto: ImmersionApplicationDto = validDemandeImmersion) {}

  public withEmail(email: string): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({ ...this.dto, email });
  }

  public withMentorEmail(mentorEmail: string): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({ ...this.dto, mentorEmail });
  }

  public withDateSubmission(
    dateSubmission: string,
  ): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({ ...this.dto, dateSubmission });
  }

  public withDateStart(dateStart: string): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({ ...this.dto, dateStart });
  }

  public withDateEnd(dateEnd: string): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({ ...this.dto, dateEnd });
  }

  public withId(id: ImmersionApplicationId): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({ ...this.dto, id });
  }

  public withSource(source: ApplicationSource): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({ ...this.dto, source });
  }

  public withAgencyCode(
    agencyCode: AgencyCode,
  ): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({ ...this.dto, agencyCode });
  }

  public withStatus(status: ApplicationStatus): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({ ...this.dto, status });
  }

  public withImmersionAddress(
    immersionAddress: string,
  ): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({
      ...this.dto,
      immersionAddress,
    });
  }

  public withSanitaryPrevention(
    sanitaryPrevention: boolean,
  ): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({
      ...this.dto,
      sanitaryPrevention,
    });
  }

  public withSanitaryPreventionDescription(
    sanitaryPreventionDescription: string,
  ): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({
      ...this.dto,
      sanitaryPreventionDescription,
    });
  }

  public withIndividualProtection(
    individualProtection: boolean,
  ): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({
      ...this.dto,
      individualProtection,
    });
  }

  public withLegacySchedule(legacySchedule: LegacyScheduleDto) {
    return new ImmersionApplicationDtoBuilder({
      ...this.dto,
      legacySchedule,
    });
  }

  public build() {
    return this.dto;
  }
}
