import { omit } from "ramda";
import { match, P } from "ts-pattern";
import type { WithAcquisition } from "../acquisition.dto";
import type { AddressDto } from "../address/address.dto";
import type { Builder } from "../Builder";
import type { BusinessName } from "../business/business";
import {
  type ConventionId,
  discoverObjective,
  type ImmersionObjective,
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
  DiscussionId,
  DiscussionKind,
  DiscussionReadDto,
  Exchange,
  ExchangeRead,
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
  exchanges: [
    {
      subject: "Sujet de discussion",
      sentAt: createdAt,
      sender: "potentialBeneficiary",
      message: "default message",
      attachments: [],
    },
  ],
  status: "PENDING",
  kind: "IF",
  contactMode: "EMAIL",
} satisfies DiscussionDto;

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
    const { appellationCode, exchanges, ...rest } = this.discussion;
    if (appellation.appellationCode !== appellationCode)
      throw new Error("Appellation code mismatch");
    return {
      ...rest,
      exchanges: exchanges.map(
        (exchange): ExchangeRead =>
          exchange.sender === "establishment"
            ? omit(["email"], exchange)
            : exchange,
      ),
      appellation,
    };
  }

  public withBusinessName(businessName: BusinessName) {
    return new DiscussionBuilder({
      ...this.discussion,
      businessName,
    });
  }

  public withDatePreference(datePreferences: string) {
    if (this.discussion.kind === "IF")
      return new DiscussionBuilder({
        ...this.discussion,
        potentialBeneficiary: {
          ...this.discussion.potentialBeneficiary,
          datePreferences,
        },
      });

    throw new Error(
      `datePreference is not allowed for discussion kind ${this.discussion.kind}.`,
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
          }) satisfies DiscussionDto,
    );
  }

  public withDiscussionKind(discussionKind: DiscussionKind) {
    const { potentialBeneficiary, ...rest } = this.discussion;

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
          }) satisfies DiscussionDto,
    );
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
    return new DiscussionBuilder({
      ...this.discussion,
      potentialBeneficiary: {
        ...this.discussion.potentialBeneficiary,
        phone,
      },
    } as DiscussionDto);
  }

  public withPotentialBeneficiaryResumeLink(resumeLink?: string) {
    if (this.discussion.kind === "IF") {
      return new DiscussionBuilder({
        ...this.discussion,
        potentialBeneficiary: {
          ...this.discussion.potentialBeneficiary,
          resumeLink,
        },
      } as DiscussionDto);
    }

    throw new Error(
      `Invalid potentialBeneficiary with resumeLink ${resumeLink} for discussionKind ${this.discussion.kind}`,
    );
  }

  public withPotentialBeneficiaryHasWorkingExperience(
    hasWorkingExperience?: boolean,
  ) {
    if (this.discussion.kind === "IF") {
      return new DiscussionBuilder({
        ...this.discussion,
        potentialBeneficiary: {
          ...this.discussion.potentialBeneficiary,
          hasWorkingExperience,
        },
      } as DiscussionDto);
    }

    throw new Error(
      `Invalid potentialBeneficiary with hasWorkingExperience ${hasWorkingExperience} for discussionKind ${this.discussion.kind}`,
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
      .with(
        {
          status: "REJECTED",
          rejectionKind: "DEPRECATED",
        },
        ({ status, rejectionKind }) => {
          updatedDiscussion = {
            ...updatedDiscussion,
            status,
            rejectionKind,
          };
        },
      )
      .exhaustive();

    return new DiscussionBuilder(updatedDiscussion);
  }
}
