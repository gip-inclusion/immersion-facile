import { P, match } from "ts-pattern";
import {
  type ContactLevelOfEducation,
  type Email,
  type Phone,
  type WithDiscussionId,
  discoverObjective,
  exchangeRoles,
} from "..";
import type { Builder } from "../Builder";
import type { WithAcquisition } from "../acquisition.dto";
import type { AddressDto } from "../address/address.dto";
import type {
  ConventionId,
  ImmersionObjective,
} from "../convention/convention.dto";
import type { ContactMode } from "../formEstablishment/FormEstablishment.dto";
import type {
  AppellationAndRomeDto,
  AppellationCode,
} from "../romeAndAppellationDtos/romeAndAppellation.dto";
import type { SiretDto } from "../siret/siret";
import type { Flavor } from "../typeFlavors";
import { includesTypeGuard } from "../typeGuard";
import type { EmptyObject, OmitFromExistingKeys } from "../utils";
import type { DateString } from "../utils/date";

export type ExchangeRole = (typeof exchangeRoles)[number];
export const isExchangeRole = includesTypeGuard(exchangeRoles);

export type DiscussionId = Flavor<string, "DiscussionId">;

export type DiscussionKind = "IF" | "1_ELEVE_1_STAGE";

type WithContactByEmailProps<
  D extends DiscussionKind,
  C extends ContactMode,
> = C extends "EMAIL"
  ? {
      datePreferences: string;
      phone: Phone;
      immersionObjective: D extends "1_ELEVE_1_STAGE"
        ? Extract<ImmersionObjective, typeof discoverObjective>
        : ImmersionObjective | null;
    }
  : EmptyObject;

type WithContactByEmailAndIFProps<
  D extends DiscussionKind,
  C extends ContactMode,
> = D extends "IF"
  ? C extends "EMAIL"
    ? {
        hasWorkingExperience: boolean;
        resumeLink?: string;
        experienceAdditionalInformation?: string;
      }
    : EmptyObject
  : EmptyObject;

type With1Eleve1StageProps<D extends DiscussionKind> =
  D extends "1_ELEVE_1_STAGE"
    ? {
        levelOfEducation: ContactLevelOfEducation;
      }
    : EmptyObject;

export type PotentialBeneficiaryCommonProps = {
  email: string;
  firstName: string;
  lastName: string;
};

export type DiscussionPotentialBeneficiary<
  D extends DiscussionKind,
  C extends ContactMode,
> = PotentialBeneficiaryCommonProps &
  WithContactByEmailProps<D, C> &
  WithContactByEmailAndIFProps<D, C> &
  With1Eleve1StageProps<D>;

export type DiscussionEstablishmentContact = {
  email: string;
  copyEmails: string[];
  firstName: string;
  lastName: string;
  phone: string;
  job: string;
};

export type CommonDiscussionDto = {
  address: AddressDto;
  appellationCode: AppellationCode;
  businessName: string;
  conventionId?: ConventionId;
  createdAt: DateString;
  establishmentContact: DiscussionEstablishmentContact;
  exchanges: Exchange[];
  id: DiscussionId;
  siret: SiretDto;
} & DiscussionStatusWithRejection &
  WithAcquisition;

type SpecificDiscussionDto<C extends ContactMode, D extends DiscussionKind> = {
  contactMode: C;
  kind: D;
  potentialBeneficiary: DiscussionPotentialBeneficiary<D, C>;
};

type GenericDiscussionDto<
  D extends DiscussionKind,
  C extends ContactMode,
> = CommonDiscussionDto & SpecificDiscussionDto<C, D>;

export type DiscussionStatus = DiscussionDto["status"];
export type RejectionKind = DiscussionRejected["rejectionKind"];

export type DiscussionStatusWithRejection =
  | DiscussionAccepted
  | DiscussionRejected
  | DiscussionPending;

export type WithDiscussionRejection =
  | RejectionWithoutReason
  | RejectionWithReason;

export type DiscussionAccepted = {
  status: "ACCEPTED";
};

export type DiscussionRejected = {
  status: "REJECTED";
} & WithDiscussionRejection;

type RejectionWithoutReason = {
  rejectionKind: "UNABLE_TO_HELP" | "NO_TIME";
};

type RejectionWithReason = {
  rejectionKind: "OTHER";
  rejectionReason: string;
};

export type DiscussionPending = {
  status: "PENDING";
};

export type DiscussionDto = DiscussionDtoIF | DiscussionDto1Eleve1Stage; // TODO: DiscussionDto = ContactEstablishmentRequestDto ? pourquoi conserver les deux ?

export type DiscussionDtoIF =
  | GenericDiscussionDto<"IF", "EMAIL">
  | GenericDiscussionDto<"IF", "IN_PERSON">
  | GenericDiscussionDto<"IF", "PHONE">;

export type DiscussionDto1Eleve1Stage =
  | GenericDiscussionDto<"1_ELEVE_1_STAGE", "EMAIL">
  | GenericDiscussionDto<"1_ELEVE_1_STAGE", "IN_PERSON">
  | GenericDiscussionDto<"1_ELEVE_1_STAGE", "PHONE">;

export type DiscussionDtoEmail =
  | GenericDiscussionDto<"IF", "EMAIL">
  | GenericDiscussionDto<"1_ELEVE_1_STAGE", "EMAIL">;

export type DiscussionDtoPhone =
  | GenericDiscussionDto<"IF", "PHONE">
  | GenericDiscussionDto<"1_ELEVE_1_STAGE", "PHONE">;

export type DiscussionDtoInPerson =
  | GenericDiscussionDto<"IF", "IN_PERSON">
  | GenericDiscussionDto<"1_ELEVE_1_STAGE", "IN_PERSON">;

export type GenericDiscussionReadDto<
  D extends DiscussionKind,
  C extends ContactMode,
> = OmitFromExistingKeys<
  GenericDiscussionDto<D, C>,
  | "establishmentContact"
  | "appellationCode"
  | "acquisitionCampaign"
  | "acquisitionKeyword"
> & {
  appellation: AppellationAndRomeDto;
  establishmentContact: OmitFromExistingKeys<
    DiscussionEstablishmentContact,
    "email" | "copyEmails" | "phone"
  >;
};

export type DiscussionReadDto =
  | GenericDiscussionReadDto<"IF", "EMAIL">
  | GenericDiscussionReadDto<"IF", "IN_PERSON">
  | GenericDiscussionReadDto<"IF", "PHONE">
  | GenericDiscussionReadDto<"1_ELEVE_1_STAGE", "EMAIL">
  | GenericDiscussionReadDto<"1_ELEVE_1_STAGE", "IN_PERSON">
  | GenericDiscussionReadDto<"1_ELEVE_1_STAGE", "PHONE">;

export type Attachment = {
  name: string;
  link: string;
};

export type Exchange = {
  subject: string;
  message: string;
  sender: ExchangeRole;
  recipient: ExchangeRole;
  sentAt: DateString;
  attachments: Attachment[];
};

export type RejectDiscussionAndSendNotificationParam = WithDiscussionId &
  (
    | {
        rejectionKind: Extract<RejectionKind, "OTHER">;
        rejectionReason: string;
      }
    | { rejectionKind: Exclude<RejectionKind, "OTHER"> }
  );

const createdAt = new Date("2023-06-23T12:00:00.000").toISOString();

const defaultDiscussion = {
  id: "9f6dad2c-6f02-11ec-90d6-0242ac120003",
  appellationCode: "11704",
  siret: "12345671234567",
  createdAt,
  businessName: "My default business name",
  address: {
    streetNumberAndAddress: "1 rue de la Paix",
    postcode: "75001",
    departmentCode: "75",
    city: "Paris",
  },
  potentialBeneficiary: {
    firstName: "ali",
    lastName: "baba",
    email: "ali-baba@gmail.com",
    phone: "+33654533456",
    resumeLink: undefined,
    hasWorkingExperience: true,
    experienceAdditionalInformation: "my super experience",
    datePreferences: "my fake date preferences",
    immersionObjective: "Confirmer un projet professionnel",
  },
  establishmentContact: {
    email: "estab@mail.com",
    copyEmails: ["copy@yolo.com"],
    firstName: "estab",
    lastName: "lishment",
    job: "job",
    phone: "+33654533457",
  },
  exchanges: [
    {
      subject: "Sujet de discussion",
      sentAt: createdAt,
      sender: "potentialBeneficiary",
      recipient: "establishment",
      message: "default message",
      attachments: [],
    } satisfies Exchange,
  ],
  status: "PENDING",
  kind: "IF",
  contactMode: "EMAIL",
} satisfies DiscussionDtoEmail;

export const cartographeAppellationAndRome: AppellationAndRomeDto = {
  romeCode: "M1808",
  appellationCode: "11704",
  romeLabel: "Information géographique",
  appellationLabel: "Cartographe",
};

export class DiscussionBuilder implements Builder<DiscussionDto> {
  constructor(private readonly discussion: DiscussionDto = defaultDiscussion) {}

  public buildRead(
    appellation: AppellationAndRomeDto = cartographeAppellationAndRome,
  ): DiscussionReadDto {
    const { appellationCode, ...rest } = this.discussion;
    if (appellation.appellationCode !== appellationCode)
      throw new Error("Appellation code mismatch");
    return {
      ...rest,
      appellation: appellation,
      establishmentContact: {
        firstName: this.discussion.establishmentContact.firstName,
        lastName: this.discussion.establishmentContact.lastName,
        job: this.discussion.establishmentContact.job,
      },
    };
  }

  public build() {
    return this.discussion;
  }

  public withAddress(address: AddressDto) {
    return new DiscussionBuilder({
      ...this.discussion,
      address,
    });
  }

  public withAppellationCode(appellationCode: AppellationCode) {
    return new DiscussionBuilder({
      ...this.discussion,
      appellationCode,
    });
  }

  public withAcquisition(acquisition: WithAcquisition) {
    return new DiscussionBuilder({
      ...this.discussion,
      ...acquisition,
    });
  }

  public withCreatedAt(createdAt: Date) {
    return new DiscussionBuilder({
      ...this.discussion,
      createdAt: createdAt.toISOString(),
    });
  }

  public withContactMode(contactMode: ContactMode) {
    const { potentialBeneficiary, ...rest } = this.discussion;
    if (contactMode === "EMAIL") {
      return new DiscussionBuilder(
        (rest.kind === "IF"
          ? {
              ...rest,
              contactMode,
              potentialBeneficiary: {
                ...defaultDiscussion.potentialBeneficiary,
                email: potentialBeneficiary.email,
                firstName: potentialBeneficiary.firstName,
                lastName: potentialBeneficiary.lastName,
                immersionObjective:
                  defaultDiscussion.potentialBeneficiary.immersionObjective,
              },
            }
          : {
              ...rest,
              contactMode,
              potentialBeneficiary: {
                email: potentialBeneficiary.email,
                firstName: potentialBeneficiary.firstName,
                lastName: potentialBeneficiary.lastName,
                levelOfEducation: "2nde",
                datePreferences:
                  defaultDiscussion.potentialBeneficiary.datePreferences,
                phone: defaultDiscussion.potentialBeneficiary.phone,
                immersionObjective:
                  "Découvrir un métier ou un secteur d'activité",
              },
            }) satisfies DiscussionDtoEmail,
      );
    }

    if (contactMode === "PHONE") {
      return new DiscussionBuilder(
        rest.kind === "IF"
          ? {
              ...rest,
              contactMode,
              potentialBeneficiary: {
                email: potentialBeneficiary.email,
                firstName: potentialBeneficiary.firstName,
                lastName: potentialBeneficiary.lastName,
              },
            }
          : {
              ...rest,
              contactMode,
              potentialBeneficiary: {
                email: potentialBeneficiary.email,
                firstName: potentialBeneficiary.firstName,
                lastName: potentialBeneficiary.lastName,
                levelOfEducation: "2nde",
              },
            },
      );
    }

    if (contactMode === "IN_PERSON") {
      return new DiscussionBuilder(
        (rest.kind === "IF"
          ? {
              ...rest,
              contactMode,
              potentialBeneficiary: {
                email: potentialBeneficiary.email,
                firstName: potentialBeneficiary.firstName,
                lastName: potentialBeneficiary.lastName,
              },
            }
          : {
              ...rest,
              contactMode,
              potentialBeneficiary: {
                email: potentialBeneficiary.email,
                firstName: potentialBeneficiary.firstName,
                lastName: potentialBeneficiary.lastName,
                levelOfEducation: "2nde",
              },
            }) satisfies DiscussionDtoInPerson,
      );
    }

    throw new Error(
      `Invalid contact mode ${contactMode} for discussion kind ${this.discussion.kind}`,
    );
  }

  public withDiscussionKind(discussionKind: DiscussionKind) {
    const { potentialBeneficiary, ...rest } = this.discussion;
    if (rest.contactMode === "EMAIL") {
      return new DiscussionBuilder(
        (discussionKind === "IF"
          ? {
              ...rest,
              kind: discussionKind,
              potentialBeneficiary: {
                ...defaultDiscussion.potentialBeneficiary,
                email: potentialBeneficiary.email,
                firstName: potentialBeneficiary.firstName,
                lastName: potentialBeneficiary.lastName,
                immersionObjective:
                  defaultDiscussion.potentialBeneficiary.immersionObjective,
              },
            }
          : {
              ...rest,
              kind: discussionKind,
              potentialBeneficiary: {
                email: potentialBeneficiary.email,
                firstName: potentialBeneficiary.firstName,
                lastName: potentialBeneficiary.lastName,
                levelOfEducation: "2nde",
                datePreferences:
                  defaultDiscussion.potentialBeneficiary.datePreferences,
                phone: defaultDiscussion.potentialBeneficiary.phone,
                immersionObjective:
                  "Découvrir un métier ou un secteur d'activité",
              },
            }) satisfies DiscussionDtoEmail,
      );
    }

    if (rest.contactMode === "PHONE") {
      return new DiscussionBuilder(
        discussionKind === "IF"
          ? {
              ...rest,
              kind: discussionKind,
              potentialBeneficiary: {
                email: potentialBeneficiary.email,
                firstName: potentialBeneficiary.firstName,
                lastName: potentialBeneficiary.lastName,
              },
            }
          : {
              ...rest,
              kind: discussionKind,
              potentialBeneficiary: {
                email: potentialBeneficiary.email,
                firstName: potentialBeneficiary.firstName,
                lastName: potentialBeneficiary.lastName,
                levelOfEducation: "2nde",
              },
            },
      );
    }

    if (rest.contactMode === "IN_PERSON") {
      return new DiscussionBuilder(
        (discussionKind === "IF"
          ? {
              ...rest,
              kind: discussionKind,
              potentialBeneficiary: {
                email: potentialBeneficiary.email,
                firstName: potentialBeneficiary.firstName,
                lastName: potentialBeneficiary.lastName,
              },
            }
          : {
              ...rest,
              kind: discussionKind,
              potentialBeneficiary: {
                email: potentialBeneficiary.email,
                firstName: potentialBeneficiary.firstName,
                lastName: potentialBeneficiary.lastName,
                levelOfEducation: "2nde",
              },
            }) satisfies DiscussionDtoInPerson,
      );
    }

    throw new Error(
      `Invalid discussion kind ${discussionKind} for contact mode ${this.discussion.contactMode}`,
    );
  }

  public withEstablishmentContact(
    establishmentContact: Partial<DiscussionEstablishmentContact>,
  ) {
    return new DiscussionBuilder({
      ...this.discussion,
      establishmentContact: {
        ...this.discussion.establishmentContact,
        ...establishmentContact,
      },
    });
  }

  public withExchanges(exchanges: Exchange[]) {
    return new DiscussionBuilder({
      ...this.discussion,
      exchanges,
    });
  }

  public withId(id: DiscussionId) {
    return new DiscussionBuilder({ ...this.discussion, id });
  }

  public withImmersionObjective(immersionObjective: ImmersionObjective | null) {
    if (this.discussion.contactMode === "EMAIL") {
      if (
        this.discussion.kind === "1_ELEVE_1_STAGE" &&
        immersionObjective === discoverObjective
      ) {
        return new DiscussionBuilder({
          ...this.discussion,
          potentialBeneficiary: {
            ...this.discussion.potentialBeneficiary,
            immersionObjective,
          },
        });
      }
      if (this.discussion.kind === "IF") {
        return new DiscussionBuilder({
          ...this.discussion,
          potentialBeneficiary: {
            ...this.discussion.potentialBeneficiary,
            immersionObjective,
          },
        });
      }
    }

    throw new Error(`Invalid immersion objective for ${this.discussion.kind}`);
  }

  public withPotentialBeneficiaryEmail(email: Email) {
    return new DiscussionBuilder({
      ...this.discussion,
      potentialBeneficiary: {
        ...this.discussion.potentialBeneficiary,
        email,
      },
    } as DiscussionDto);
  }

  public withPotentialBeneficiaryFirstname(firstName: string) {
    return new DiscussionBuilder({
      ...this.discussion,
      potentialBeneficiary: {
        ...this.discussion.potentialBeneficiary,
        firstName,
      },
    } as DiscussionDto);
  }

  public withPotentialBeneficiaryLastName(lastName: string) {
    return new DiscussionBuilder({
      ...this.discussion,
      potentialBeneficiary: {
        ...this.discussion.potentialBeneficiary,
        lastName,
      },
    } as DiscussionDto);
  }

  public withPotentialBeneficiaryPhone(phone: string) {
    if (this.discussion.contactMode !== "EMAIL") {
      throw new Error(
        `Invalid potentialBeneficiary with phone ${phone} for contactMode ${this.discussion.contactMode}`,
      );
    }

    return new DiscussionBuilder({
      ...this.discussion,
      potentialBeneficiary: {
        ...this.discussion.potentialBeneficiary,
        phone,
      },
    } as DiscussionDto);
  }

  public withPotentialBeneficiaryResumeLink(resumeLink?: string) {
    if (
      this.discussion.contactMode === "EMAIL" &&
      this.discussion.kind === "IF"
    ) {
      return new DiscussionBuilder({
        ...this.discussion,
        potentialBeneficiary: {
          ...this.discussion.potentialBeneficiary,
          resumeLink,
        },
      } as DiscussionDto);
    }
    throw new Error(
      `Invalid potentialBeneficiary with resumeLink ${resumeLink} for contactMode ${this.discussion.contactMode} and discussionKind ${this.discussion.kind}`,
    );
  }

  public withPotentialBeneficiaryHasWorkingExperience(
    hasWorkingExperience?: boolean,
  ) {
    if (
      this.discussion.contactMode === "EMAIL" &&
      this.discussion.kind === "IF"
    ) {
      return new DiscussionBuilder({
        ...this.discussion,
        potentialBeneficiary: {
          ...this.discussion.potentialBeneficiary,
          hasWorkingExperience,
        },
      } as DiscussionDto);
    }
    throw new Error(
      `Invalid potentialBeneficiary with hasWorkingExperience ${hasWorkingExperience} for contactMode ${this.discussion.contactMode} and discussionKind ${this.discussion.kind}`,
    );
  }

  public withSiret(siret: SiretDto) {
    return new DiscussionBuilder({
      ...this.discussion,
      siret,
    });
  }

  withConventionId(id: ConventionId) {
    return new DiscussionBuilder({
      ...this.discussion,
      conventionId: id,
    });
  }
  withStatus(
    status: DiscussionStatus,
    rejectionKind?: RejectionKind,
    rejectionReason?: string,
  ) {
    let updatedDiscussion: DiscussionDto = this.discussion;

    match({
      status,
      rejectionKind,
      rejectionReason,
    })
      .with(
        {
          status: "PENDING",
        },
        ({ status }) => {
          updatedDiscussion = {
            ...updatedDiscussion,
            status,
          };
        },
      )
      .with(
        {
          status: "ACCEPTED",
        },
        ({ status }) => {
          updatedDiscussion = {
            ...updatedDiscussion,
            status,
          };
        },
      )
      .with(
        {
          status: "REJECTED",
          rejectionKind: P.union("UNABLE_TO_HELP", "NO_TIME"),
        },
        ({ status, rejectionKind }) => {
          updatedDiscussion = {
            ...updatedDiscussion,
            status,
            rejectionKind,
          };
        },
      )
      .with(
        {
          status: "REJECTED",
          rejectionKind: "OTHER",
        },
        ({ status, rejectionKind, rejectionReason }) => {
          updatedDiscussion = {
            ...updatedDiscussion,
            status,
            rejectionKind,
            rejectionReason: rejectionReason ?? "default rejection reason",
          };
        },
      )
      .with(
        {
          status: "REJECTED",
          rejectionKind: P.nullish,
        },
        ({ status }) => {
          updatedDiscussion = {
            ...updatedDiscussion,
            status,
            rejectionKind: "UNABLE_TO_HELP",
          };
        },
      );

    return new DiscussionBuilder(updatedDiscussion);
  }
}
