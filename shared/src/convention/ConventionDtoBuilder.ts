import { AgencyId } from "../agency/agency.dto";
import {
  LegacyScheduleDto,
  reasonableSchedule,
  ScheduleDto,
} from "../schedule/ScheduleSchema";
import { Builder } from "../Builder";
import {
  ConventionStatus,
  ConventionDto,
  ConventionId,
  ConventionExternalId,
  ImmersionObjective,
} from "./convention.dto";
import { AppellationDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { FederatedIdentity } from "../federatedIdentities/federatedIdentity.dto";

export const DEMANDE_IMMERSION_ID = "40400404-9c0b-bbbb-bb6d-6bb9bd38bbbb";
export const CONVENTION_EXTERNAL_ID = "00000000001";
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

const validConvention: ConventionDto = {
  id: DEMANDE_IMMERSION_ID,
  externalId: CONVENTION_EXTERNAL_ID,
  status: "DRAFT",
  postalCode: "75001",
  agencyId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  email: VALID_EMAILS[0],
  phone: VALID_PHONES[0],
  firstName: "Esteban",
  lastName: "Ocon",
  immersionAddress: "169 boulevard de la villette, 75010 Paris",
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

export class ConventionDtoBuilder implements Builder<ConventionDto> {
  constructor(private dto: ConventionDto = validConvention) {}

  public withBusinessName(businessName: string): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, businessName });
  }

  public withEmail(email: string): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, email });
  }

  public withFirstName(firstName: string): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, firstName });
  }

  public withLastName(lastName: string): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, lastName });
  }

  public withPhone(phone: string): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, phone });
  }

  public withMentor(mentor: string): ConventionDtoBuilder {
    return new ConventionDtoBuilder({
      ...this.dto,
      mentor,
    });
  }

  public withMentorPhone(mentorPhone: string): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, mentorPhone });
  }

  public withMentorEmail(mentorEmail: string): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, mentorEmail });
  }

  public withDateSubmission(dateSubmission: string): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, dateSubmission });
  }

  public withDateStart(dateStart: string): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, dateStart });
  }

  public withDateEnd(dateEnd: string): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, dateEnd });
  }

  public withId(id: ConventionId): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, id });
  }
  public withExternalId(
    externalId: ConventionExternalId,
  ): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, externalId });
  }
  public withAgencyId(agencyId: AgencyId): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, agencyId });
  }

  public withStatus(status: ConventionStatus): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, status });
  }
  public validated(): ConventionDtoBuilder {
    return new ConventionDtoBuilder({
      ...this.dto,
      status: "ACCEPTED_BY_VALIDATOR",
    });
  }

  public withImmersionAddress(immersionAddress: string): ConventionDtoBuilder {
    return new ConventionDtoBuilder({
      ...this.dto,
      immersionAddress,
    });
  }

  public withSanitaryPrevention(
    sanitaryPrevention: boolean,
  ): ConventionDtoBuilder {
    return new ConventionDtoBuilder({
      ...this.dto,
      sanitaryPrevention,
    });
  }

  public withSanitaryPreventionDescription(
    sanitaryPreventionDescription: string,
  ): ConventionDtoBuilder {
    return new ConventionDtoBuilder({
      ...this.dto,
      sanitaryPreventionDescription,
    });
  }

  public withIndividualProtection(
    individualProtection: boolean,
  ): ConventionDtoBuilder {
    return new ConventionDtoBuilder({
      ...this.dto,
      individualProtection,
    });
  }

  public withLegacySchedule(legacySchedule: LegacyScheduleDto) {
    return new ConventionDtoBuilder({
      ...this.dto,
      legacySchedule,
    });
  }

  public withSchedule(schedule: ScheduleDto) {
    return new ConventionDtoBuilder({
      ...this.dto,
      schedule,
    });
  }

  public withRejectionJustification(rejectionJustification: string) {
    return new ConventionDtoBuilder({
      ...this.dto,
      rejectionJustification,
    });
  }

  public withoutWorkCondition(): ConventionDtoBuilder {
    return new ConventionDtoBuilder({
      ...this.dto,
      workConditions: undefined,
    });
  }

  public withImmersionAppelation(
    immersionAppellation: AppellationDto,
  ): ConventionDtoBuilder {
    return new ConventionDtoBuilder({
      ...this.dto,
      immersionAppellation,
    });
  }

  withFederatedIdentity(
    federatedIdentity: FederatedIdentity,
  ): ConventionDtoBuilder {
    return new ConventionDtoBuilder({
      ...this.dto,
      federatedIdentity,
    });
  }
  withoutFederatedIdentity(): ConventionDtoBuilder {
    return new ConventionDtoBuilder({
      ...this.dto,
      federatedIdentity: undefined,
    });
  }
  public notSigned() {
    return new ConventionDtoBuilder({
      ...this.dto,
      beneficiaryAccepted: false,
      enterpriseAccepted: false,
    });
  }

  public signedByBeneficiary() {
    return new ConventionDtoBuilder({
      ...this.dto,
      beneficiaryAccepted: true,
    });
  }

  public signedByEnterprise() {
    return new ConventionDtoBuilder({
      ...this.dto,
      enterpriseAccepted: true,
    });
  }

  public withImmersionObjective(
    immersionObjective: ImmersionObjective,
  ): ConventionDtoBuilder {
    return new ConventionDtoBuilder({
      ...this.dto,
      immersionObjective,
    });
  }

  public build() {
    return this.dto;
  }
}
