import { AgencyId } from "shared/src/agency/agency.dto";
import {
  LegacyScheduleDto,
  reasonableSchedule,
  ScheduleDto,
} from "shared/src/ScheduleSchema";
import { Builder } from "./Builder";
import {
  ApplicationStatus,
  ImmersionApplicationDto,
  ImmersionApplicationId,
} from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { AppellationDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";

export const DEMANDE_IMMERSION_ID = "40400404-9c0b-bbbb-bb6d-6bb9bd38bbbb";
export const VALID_EMAILS = [
  "beneficiary@email.fr",
  "establishment@example.com",
];
export const DATE_SUBMISSION = "2021-01-04";
export const DATE_START = "2021-01-06";
export const DATE_END = "2021-01-15";
export const VALID_PHONES = [
  "+33012345678",
  "0601010101",
  "+18001231234",
  "+41800001853",
];

const validImmersionApplication: ImmersionApplicationDto = {
  id: DEMANDE_IMMERSION_ID,
  status: "DRAFT",
  postalCode: "75001",
  agencyId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  email: VALID_EMAILS[0],
  phone: VALID_PHONES[0],
  firstName: "Esteban",
  lastName: "Ocon",
  emergencyContact: "Clariss Ocon",
  emergencyContactPhone: "0663567896",
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
  immersionAppellation: {
    romeCode: "A1101",
    romeLabel: "Conduite d'engins agricoles et forestiers",
    appellationCode: "17751",
    appellationLabel: "Pilote de machines d'abattage",
  },
  immersionActivities: "Piloter un automobile",
  immersionSkills: "Utilisation des pneus optimale, gestion de carburant",
  beneficiaryAccepted: true,
  enterpriseAccepted: true,
};

export class ImmersionApplicationDtoBuilder
  implements Builder<ImmersionApplicationDto>
{
  constructor(
    private dto: ImmersionApplicationDto = validImmersionApplication,
  ) {}

  public withEmail(email: string): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({ ...this.dto, email });
  }

  public withFirstName(firstName: string): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({ ...this.dto, firstName });
  }

  public withLastName(lastName: string): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({ ...this.dto, lastName });
  }

  public withPhone(phone: string): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({ ...this.dto, phone });
  }

  public withMentor(mentor: string): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({
      ...this.dto,
      mentor,
    });
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

  public withSchedule(schedule: ScheduleDto) {
    return new ImmersionApplicationDtoBuilder({
      ...this.dto,
      schedule,
    });
  }

  public withRejectionJustification(rejectionJustification: string) {
    return new ImmersionApplicationDtoBuilder({
      ...this.dto,
      rejectionJustification,
    });
  }

  public withoutPeExternalId(): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({
      ...this.dto,
      peExternalId: undefined,
    });
  }

  public withoutWorkCondition(): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({
      ...this.dto,
      workConditions: undefined,
    });
  }
  public withImmersinAppelation(
    immersionAppellation: AppellationDto,
  ): ImmersionApplicationDtoBuilder {
    return new ImmersionApplicationDtoBuilder({
      ...this.dto,
      immersionAppellation,
    });
  }
  public notSigned() {
    return new ImmersionApplicationDtoBuilder({
      ...this.dto,
      beneficiaryAccepted: false,
      enterpriseAccepted: false,
    });
  }

  public signedByBeneficiary() {
    return new ImmersionApplicationDtoBuilder({
      ...this.dto,
      beneficiaryAccepted: true,
    });
  }

  public signedByEnterprise() {
    return new ImmersionApplicationDtoBuilder({
      ...this.dto,
      enterpriseAccepted: true,
    });
  }

  public build() {
    return this.dto;
  }
}
