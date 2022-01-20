import { AgencyId } from "../shared/agencies";
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

export const DEMANDE_IMMERSION_ID = "40400000000000404";
export const VALID_EMAILS = ["valid@email.fr", "name@example.com"];
export const DATE_SUBMISSION = "2021-01-04";
export const DATE_START = "2021-01-06";
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
  postalCode: "75001",
  agencyId: "a025666a-22d7-4752-86eb-d07e27a5766a",
  email: VALID_EMAILS[0],
  phone: VALID_PHONES[0],
  firstName: "Esteban",
  lastName: "Ocon",
  dateSubmission: DATE_SUBMISSION,
  dateStart: DATE_START,
  dateEnd: DATE_END,
  businessName: "Beta.gouv.fr",
  siret: "12345678901234",
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

  public withPhone(phone: string): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({ ...this.dto, phone });
  }

  public withMentorPhone(mentorPhone: string): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({ ...this.dto, mentorPhone });
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

  public withAgencyId(agencyId: AgencyId): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({ ...this.dto, agencyId });
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

  public withRejectionJustification(rejectionJustification: string) {
    return new ImmersionApplicationDtoBuilder({
      ...this.dto,
      rejectionJustification,
    });
  }

  public build() {
    return this.dto;
  }
}
