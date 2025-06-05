import { P, match } from "ts-pattern";
import type { Builder } from "../Builder";
import type { WithAcquisition } from "../acquisition.dto";
import type { AddressDto } from "../address/address.dto";
import {
  type ConventionId,
  type ImmersionObjective,
  discoverObjective,
} from "../convention/convention.dto";
import type { Email } from "../email/email.dto";
import type { ContactMode } from "../formEstablishment/FormEstablishment.dto";
import type {
  AppellationAndRomeDto,
  AppellationCode,
} from "../romeAndAppellationDtos/romeAndAppellation.dto";
import type { SiretDto } from "../siret/siret";
import type {
  DiscussionDto,
  DiscussionDtoEmail,
  DiscussionDtoInPerson,
  DiscussionEstablishmentContact,
  DiscussionId,
  DiscussionKind,
  DiscussionReadDto,
  Exchange,
  WithDiscussionStatus,
} from "./discussion.dto";

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

  public withDatePreference(datePreferences: string) {
    if (
      this.discussion.kind === "IF" &&
      this.discussion.contactMode === "EMAIL"
    )
      return new DiscussionBuilder({
        ...this.discussion,
        potentialBeneficiary: {
          ...this.discussion.potentialBeneficiary,
          datePreferences,
        },
      });
    throw new Error(
      `datePreference is not allowed for discussion kind ${this.discussion.kind} and contactMode ${this.discussion.contactMode}.`,
    );
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

  withStatus(withStatus: WithDiscussionStatus) {
    let updatedDiscussion: DiscussionDto = this.discussion;

    match(withStatus)
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
        ({ status, candidateWarnedMethod }) => {
          updatedDiscussion = {
            ...updatedDiscussion,
            status,
            candidateWarnedMethod,
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
          rejectionKind: "CANDIDATE_ALREADY_WARNED",
        },
        ({ status, rejectionKind, candidateWarnedMethod }) => {
          updatedDiscussion = {
            ...updatedDiscussion,
            status,
            rejectionKind,
            candidateWarnedMethod,
          };
        },
      )
      .exhaustive();

    return new DiscussionBuilder(updatedDiscussion);
  }
}
