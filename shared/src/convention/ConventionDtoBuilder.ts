import { AgencyId } from "../agency/agency.dto";
import { Builder } from "../Builder";
import { PeConnectIdentity } from "../federatedIdentities/federatedIdentity.dto";
import { AppellationAndRomeDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import {
  DateIntervalDto,
  ScheduleDto,
  Weekday,
} from "../schedule/Schedule.dto";
import { reasonableSchedule } from "../schedule/ScheduleUtils";
import {
  Beneficiary,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionDto,
  ConventionId,
  ConventionStatus,
  ConventionValidator,
  ConventionValidators,
  EstablishmentRepresentative,
  EstablishmentTutor,
  ImmersionObjective,
  InternshipKind,
  isBeneficiary,
  isBeneficiaryStudent,
  Renewed,
} from "./convention.dto";

export const DEMANDE_IMMERSION_ID = "a99eaca1-ee70-4c90-b3f4-668d492f7392";
export const VALID_EMAILS = [
  "beneficiary@email.fr",
  "establishment@example.com",
  "validator@mail.com",
];
export const DATE_SUBMISSION = new Date("2021-01-04").toISOString();
export const DATE_START = new Date("2021-01-06").toISOString();
export const DATE_END = new Date("2021-01-15").toISOString();
export const DATE_SIGNATURE = new Date("2021-01-04").toISOString();

export const VALID_PHONES = [
  "+33012345678",
  "0601010101",
  "+18001231234",
  "+41800001853",
];

const beneficiary: Beneficiary<"immersion"> = {
  role: "beneficiary",
  email: VALID_EMAILS[0],
  phone: VALID_PHONES[0],
  firstName: "Esteban",
  lastName: "Ocon",
  signedAt: DATE_SIGNATURE,
  emergencyContact: "Clariss Ocon",
  emergencyContactPhone: "0663567896",
  emergencyContactEmail: "clariss.ocon@emergencycontact.com",
  financiaryHelp: "Un stage rémunéré au SMIC?",
  birthdate: "2002-10-05T14:48:00.000Z",
};

const establishmentTutor: EstablishmentTutor = {
  role: "establishment-tutor",
  email: VALID_EMAILS[1],
  phone: VALID_PHONES[1],
  firstName: "Alain",
  lastName: "Prost",
  job: "Big Boss",
};

const establishmentRepresentative: EstablishmentRepresentative = {
  email: "establishment@example.com",
  firstName: "Billy",
  lastName: "Idol",
  phone: "0602010203",
  role: "establishment-representative",
  signedAt: DATE_SIGNATURE,
};

const validConvention: ConventionDto = {
  id: DEMANDE_IMMERSION_ID,
  status: "DRAFT",
  agencyId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  immersionAddress: "169 boulevard de la villette, 75010 Paris",
  dateSubmission: DATE_SUBMISSION,
  dateStart: DATE_START,
  dateEnd: DATE_END,
  businessName: "Beta.gouv.fr",
  siret: "12345678901234",
  schedule: reasonableSchedule({
    start: new Date(DATE_START),
    end: new Date(DATE_END),
  }),
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
  businessAdvantages: "Prise en charge du panier repas",
  immersionActivities: "Piloter un automobile",
  immersionSkills: "Utilisation des pneus optimale, gestion de carburant",
  internshipKind: "immersion",
  signatories: { beneficiary, establishmentRepresentative },
  establishmentTutor,
};

export class ConventionDtoBuilder implements Builder<ConventionDto> {
  constructor(private dto: ConventionDto = validConvention) {}

  public build() {
    return this.dto;
  }

  public notSigned(): ConventionDtoBuilder {
    if (
      this.dto.internshipKind === "immersion" &&
      isBeneficiary(this.dto.signatories.beneficiary)
    ) {
      this.dto = {
        ...this.dto,
        signatories: {
          beneficiary: {
            ...this.dto.signatories.beneficiary,
            signedAt: undefined,
          },
          beneficiaryCurrentEmployer: this.#beneficiaryCurrentEmployer && {
            ...this.#beneficiaryCurrentEmployer,
            signedAt: undefined,
          },
          establishmentRepresentative: {
            ...this.#establishmentRepresentative,
            signedAt: undefined,
          },
          beneficiaryRepresentative: this.#beneficiaryRepresentative && {
            ...this.#beneficiaryRepresentative,
            signedAt: undefined,
          },
        },
      };
      return new ConventionDtoBuilder(this.dto);
    }
    if (
      this.dto.internshipKind === "mini-stage-cci" &&
      isBeneficiaryStudent(this.dto.signatories.beneficiary)
    ) {
      this.dto = {
        ...this.dto,
        signatories: {
          beneficiary: {
            ...this.dto.signatories.beneficiary,
            signedAt: undefined,
          },
          beneficiaryCurrentEmployer: this.#beneficiaryCurrentEmployer && {
            ...this.#beneficiaryCurrentEmployer,
            signedAt: undefined,
          },
          establishmentRepresentative: {
            ...this.#establishmentRepresentative,
            signedAt: undefined,
          },
          beneficiaryRepresentative: this.#beneficiaryRepresentative && {
            ...this.#beneficiaryRepresentative,
            signedAt: undefined,
          },
        },
      };
      return new ConventionDtoBuilder(this.dto);
    }
    throw new Error(
      `Beneficiary is not compatible with convention internship kind '${this.dto.internshipKind}'.`,
    );
  }

  public signedByBeneficiary(signedAt: string | undefined) {
    return this.withBeneficiary({
      ...this.#beneficiary,
      signedAt,
    });
  }

  public signedByBeneficiaryRepresentative(signedAt: string | undefined) {
    const beneficiaryRepresentative =
      this.dto.signatories.beneficiaryRepresentative;
    if (beneficiaryRepresentative)
      return this.withBeneficiaryRepresentative({
        ...beneficiaryRepresentative,
        signedAt,
      });
    throw new Error(
      "Can't sign convention as beneficiary representative beacause there is no beneficiary representative on convention.",
    );
  }

  public signedByEstablishmentRepresentative(signedAt: string | undefined) {
    return this.withEstablishmentRepresentative({
      ...this.#establishmentRepresentative,
      signedAt,
    });
  }

  public validated(): ConventionDtoBuilder {
    return new ConventionDtoBuilder({
      ...this.dto,
      status: "ACCEPTED_BY_VALIDATOR",
    });
  }

  public withAgencyId(agencyId: AgencyId): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, agencyId });
  }

  public withBeneficiary(
    beneficiary: Beneficiary<InternshipKind>,
  ): ConventionDtoBuilder {
    if (this.dto.internshipKind === "immersion" && isBeneficiary(beneficiary)) {
      return new ConventionDtoBuilder({
        ...this.dto,
        signatories: {
          ...this.dto.signatories,
          beneficiary,
        },
      });
    }
    if (
      this.dto.internshipKind === "mini-stage-cci" &&
      isBeneficiaryStudent(beneficiary)
    )
      return new ConventionDtoBuilder({
        ...this.dto,
        signatories: {
          ...this.dto.signatories,
          beneficiary,
        },
      });
    throw new Error(
      `Beneficiary is not compatible with convention internship kind '${this.dto.internshipKind}'.`,
    );
  }

  public withBeneficiaryCurrentEmployer(
    beneficiaryCurrentEmployer: BeneficiaryCurrentEmployer | undefined,
  ): ConventionDtoBuilder {
    if (
      this.dto.internshipKind === "immersion" &&
      isBeneficiary(this.dto.signatories.beneficiary)
    ) {
      return new ConventionDtoBuilder({
        ...this.dto,
        signatories: {
          ...this.dto.signatories,
          beneficiaryCurrentEmployer,
        },
      });
    }
    if (
      this.dto.internshipKind === "mini-stage-cci" &&
      isBeneficiaryStudent(this.dto.signatories.beneficiary)
    )
      return new ConventionDtoBuilder({
        ...this.dto,
        signatories: {
          ...this.dto.signatories,
          beneficiaryCurrentEmployer,
        },
      });
    throw new Error(
      `Beneficiary is not compatible with convention internship kind '${this.dto.internshipKind}'.`,
    );
  }

  public withBeneficiaryEmail(email: string): ConventionDtoBuilder {
    return this.withBeneficiary({ ...this.#beneficiary, email });
  }

  public withBeneficiaryEmergencyContactEmail(
    emergencyContactEmail: string | undefined,
  ) {
    return this.withBeneficiary({
      ...this.#beneficiary,
      emergencyContactEmail,
    });
  }

  public withBeneficiaryFirstName(firstName: string): ConventionDtoBuilder {
    return this.withBeneficiary({
      ...this.#beneficiary,
      firstName,
    });
  }

  public withBeneficiaryLastName(lastName: string): ConventionDtoBuilder {
    return this.withBeneficiary({
      ...this.#beneficiary,
      lastName,
    });
  }

  public withBeneficiaryPhone(phone: string): ConventionDtoBuilder {
    return this.withBeneficiary({ ...this.#beneficiary, phone });
  }

  public withBeneficiaryRepresentative(
    beneficiaryRepresentative: BeneficiaryRepresentative | undefined,
  ): ConventionDtoBuilder {
    if (
      this.dto.internshipKind === "immersion" &&
      isBeneficiary(this.dto.signatories.beneficiary)
    ) {
      return new ConventionDtoBuilder({
        ...this.dto,
        signatories: {
          ...this.dto.signatories,
          beneficiaryRepresentative,
        },
      });
    }
    if (
      this.dto.internshipKind === "mini-stage-cci" &&
      isBeneficiaryStudent(this.dto.signatories.beneficiary)
    )
      return new ConventionDtoBuilder({
        ...this.dto,
        signatories: {
          ...this.dto.signatories,
          beneficiaryRepresentative,
        },
      });
    throw new Error(
      `Beneficiary is not compatible with convention internship kind '${this.dto.internshipKind}'.`,
    );
  }

  public withBeneficiaryRepresentativeEmail(email: string) {
    const beneficiaryRepresentative =
      this.dto.signatories.beneficiaryRepresentative;
    if (beneficiaryRepresentative)
      return this.withBeneficiaryRepresentative({
        ...beneficiaryRepresentative,
        email,
      });
    throw new Error("beneficiaryRepresentative is undefined.");
  }

  public withBeneficiarySignedAt(signedAt?: Date) {
    return this.withBeneficiary({
      ...this.dto.signatories.beneficiary,
      signedAt: signedAt && signedAt.toISOString(),
    });
  }

  public withBusinessName(businessName: string): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, businessName });
  }

  public withDateEnd(dateEnd: string): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, dateEnd });
  }

  public withDateStart(dateStart: string): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, dateStart });
  }

  public withDateSubmission(dateSubmission: string): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, dateSubmission });
  }

  public withDateValidation(
    dateValidation: string | undefined,
  ): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, dateValidation });
  }

  public withEstablishementTutorPhone(phone: string): ConventionDtoBuilder {
    return this.withEstablishmentTutor({ ...this.#establishmentTutor, phone });
  }

  public withEstablishmentRepresentative(
    establishmentRepresentative: EstablishmentRepresentative,
  ) {
    if (
      this.dto.internshipKind === "immersion" &&
      isBeneficiary(this.dto.signatories.beneficiary)
    ) {
      return new ConventionDtoBuilder({
        ...this.dto,
        signatories: {
          ...this.dto.signatories,
          establishmentRepresentative,
        },
      });
    }
    if (
      this.dto.internshipKind === "mini-stage-cci" &&
      isBeneficiaryStudent(this.dto.signatories.beneficiary)
    )
      return new ConventionDtoBuilder({
        ...this.dto,
        signatories: {
          ...this.dto.signatories,
          establishmentRepresentative,
        },
      });
    throw new Error(
      `Beneficiary is not compatible with convention internship kind '${this.dto.internshipKind}'.`,
    );
  }

  public withEstablishmentRepresentativeEmail(email: string) {
    return this.withEstablishmentRepresentative({
      ...this.#establishmentRepresentative,
      email,
    });
  }

  public withEstablishmentRepresentativeFirstName(firstName: string) {
    return this.withEstablishmentRepresentative({
      ...this.dto.signatories.establishmentRepresentative,
      firstName,
    });
  }

  public withEstablishmentRepresentativeLastName(lastName: string) {
    return this.withEstablishmentRepresentative({
      ...this.dto.signatories.establishmentRepresentative,
      lastName,
    });
  }

  public withEstablishmentRepresentativePhone(phone: string) {
    return this.withEstablishmentRepresentative({
      ...this.dto.signatories.establishmentRepresentative,
      phone,
    });
  }

  public withEstablishmentRepresentativeSignedAt(signedAt?: Date) {
    return this.withEstablishmentRepresentative({
      ...this.#establishmentRepresentative,
      signedAt: signedAt && signedAt.toISOString(),
    });
  }

  public withEstablishmentTutor(
    establishmentTutor: EstablishmentTutor,
  ): ConventionDtoBuilder {
    return new ConventionDtoBuilder({
      ...this.dto,
      establishmentTutor,
    });
  }

  public withEstablishmentTutorEmail(email: string): ConventionDtoBuilder {
    return this.withEstablishmentTutor({ ...this.#establishmentTutor, email });
  }

  public withEstablishmentTutorFirstName(
    firstName: string,
  ): ConventionDtoBuilder {
    return this.withEstablishmentTutor({
      ...this.#establishmentTutor,
      firstName,
    });
  }

  public withEstablishmentTutorLastName(
    lastName: string,
  ): ConventionDtoBuilder {
    return this.withEstablishmentTutor({
      ...this.#establishmentTutor,
      lastName,
    });
  }

  public withFederatedIdentity(
    federatedIdentity: PeConnectIdentity | undefined,
  ): ConventionDtoBuilder {
    return this.withBeneficiary({
      ...this.#beneficiary,
      ...(federatedIdentity ? { federatedIdentity } : {}),
    });
  }

  public withId(id: ConventionId): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, id });
  }

  public withImmersionAddress(immersionAddress: string): ConventionDtoBuilder {
    return new ConventionDtoBuilder({
      ...this.dto,
      immersionAddress,
    });
  }

  public withImmersionAppelation(
    immersionAppellation: AppellationAndRomeDto,
  ): ConventionDtoBuilder {
    return new ConventionDtoBuilder({
      ...this.dto,
      immersionAppellation,
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

  public withIndividualProtection(
    individualProtection: boolean,
  ): ConventionDtoBuilder {
    return new ConventionDtoBuilder({
      ...this.dto,
      individualProtection,
    });
  }

  public withInternshipKind(
    internshipKind: InternshipKind,
  ): ConventionDtoBuilder {
    return internshipKind === "immersion"
      ? new ConventionDtoBuilder({
          ...this.dto,
          internshipKind,
          signatories: {
            ...this.dto.signatories,
            beneficiary,
          },
        })
      : new ConventionDtoBuilder({
          ...this.dto,
          internshipKind,
          signatories: {
            ...this.dto.signatories,
            beneficiary: {
              ...beneficiary,
              levelOfEducation: "3ème",
            },
          },
        });
  }

  public withoutDateValidation(): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, dateValidation: undefined });
  }

  public withoutFederatedIdentity(): ConventionDtoBuilder {
    return this.withBeneficiary({
      ...this.#beneficiary,
      federatedIdentity: undefined,
    });
  }

  public withoutWorkCondition(): ConventionDtoBuilder {
    return new ConventionDtoBuilder({
      ...this.dto,
      workConditions: undefined,
    });
  }

  public withRenewed(renewed: Renewed) {
    return new ConventionDtoBuilder({
      ...this.dto,
      renewed,
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

  public withSchedule(
    scheduleMaker: (
      interval: DateIntervalDto,
      excludedDays: Weekday[],
    ) => ScheduleDto,
    excludedDays: Weekday[] = [],
  ) {
    return new ConventionDtoBuilder({
      ...this.dto,
      schedule: scheduleMaker(
        {
          start: new Date(this.dto.dateStart),
          end: new Date(this.dto.dateEnd),
        },
        excludedDays,
      ),
    });
  }

  public withStatus(status: ConventionStatus): ConventionDtoBuilder {
    return new ConventionDtoBuilder({ ...this.dto, status });
  }

  public withStatusJustification(statusJustification: string | undefined) {
    return new ConventionDtoBuilder({
      ...this.dto,
      statusJustification,
    });
  }

  public withValidator(validator: ConventionValidator): ConventionDtoBuilder {
    const validatorKind: keyof ConventionValidators =
      this.dto.status === "ACCEPTED_BY_COUNSELLOR"
        ? "agencyCounsellor"
        : "agencyValidator";
    this.dto = {
      ...this.dto,
      validators: this.dto.validators
        ? {
            ...this.dto.validators,
            [validatorKind]: validator,
          }
        : {
            [validatorKind]: validator,
          },
    };
    return new ConventionDtoBuilder(this.dto);
  }

  get #validators(): ConventionValidators | undefined {
    return this.dto.validators;
  }

  get #establishmentRepresentative(): EstablishmentRepresentative {
    return this.dto.signatories.establishmentRepresentative;
  }

  get #establishmentTutor(): EstablishmentTutor {
    return this.dto.establishmentTutor;
  }

  get #beneficiary(): Beneficiary<InternshipKind> {
    return this.dto.signatories.beneficiary;
  }

  get #beneficiaryCurrentEmployer(): BeneficiaryCurrentEmployer | undefined {
    return this.dto.signatories.beneficiaryCurrentEmployer;
  }

  get #beneficiaryRepresentative(): BeneficiaryRepresentative | undefined {
    return this.dto.signatories.beneficiaryRepresentative;
  }
}
