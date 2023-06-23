import {
  AppellationCode,
  Builder,
  ContactMethod,
  ImmersionObjective,
  SiretDto,
  AddressDto,
  Email,
} from "shared";
import {
  DiscussionAggregate,
  DiscussionId,
  ExchangeEntity,
} from "../domain/immersionOffer/entities/DiscussionAggregate";
// TODO : create a DiscussionAggregateBuilder

const createdAt = new Date("2023-06-23T12:00:00.000");

// exemple to start :
// export class DiscussionAggregateBuilder implements Builder<DiscussionAggregate> {...}

// const createDiscussionAggregate = ({
//   id,
//   siret,
//   immersionObjective,
//   potentialBeneficiaryResumeLink,
//   potentialBeneficiaryPhone,
//   appellationCode,
//   establishmentContact = {},
//   address,
//   createdAt,
// }: {
//   id: string;
//   siret: SiretDto;
//   potentialBeneficiaryPhone: string;
//   immersionObjective: ImmersionObjective | null;
//   appellationCode: ApplicationCode;
//   potentialBeneficiaryResumeLink?: string;
//   address?: AddressDto;
//   establishmentContact?: Partial<{
//     email: Email;
//     firstName: string;
//     lastName: string;
//     phone: string;
//     job: string;
//     copyEmails: string[];
//   }>;
//   createdAt: Date;
// }): DiscussionAggregate => ({
//   id,
//   appellationCode,
//   siret,
//   createdAt,
//   immersionObjective,
//   address: address ?? {
//     streetNumberAndAddress: "1 rue de la Paix",
//     postcode: "75001",
//     departmentCode: "75",
//     city: "Paris",
//   },
//   potentialBeneficiary: {
//     firstName: "Claire",
//     lastName: "Bertrand",
//     email: "claire.bertrand@email.fr",
//     phone: potentialBeneficiaryPhone,
//     resumeLink: potentialBeneficiaryResumeLink,
//   },
//   establishmentContact: {
//     contactMode: "EMAIL",
//     email: establishmentContact.email ?? "establishment@mail.com",
//     firstName: establishmentContact.firstName ?? "Jean",
//     lastName: establishmentContact.lastName ?? "Dupont",
//     phone: establishmentContact.phone ?? "0123456789",
//     job: establishmentContact.job ?? "Directeur",
//     copyEmails: establishmentContact.copyEmails ?? [],
//   },
//   exchanges: [
//     {
//       sentAt: createdAt,
//       message: "Bonjour ! J'aimerais faire une immersion.",
//       recipient: "establishment",
//       sender: "potentialBeneficiary",
//     },
//   ],
//   immersionObjective: null,
// };

export class DiscussionAggregateBuilder
  implements Builder<DiscussionAggregate>
{
  constructor(
    private readonly discussionAggregate: DiscussionAggregate = defaultDiscussionAggregateV2,
  ) {}

  withId(id: DiscussionId) {
    return new DiscussionAggregateBuilder({ ...this.discussionAggregate, id });
  }

  withContactMode(contactMode: ContactMethod) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      contactMode,
    });
  }

  withPotentialBeneficiaryEmail(potentialBeneficiaryEmail: string) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      potentialBeneficiaryEmail,
    });
  }
  withPotentialBeneficiaryPhone(potentialBeneficiaryPhone: string) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      potentialBeneficiaryPhone,
    });
  }

  withPotentialBeneficiaryFirstName(potentialBeneficiaryFirstName: string) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      potentialBeneficiaryFirstName,
    });
  }

  withPotentialBeneficiaryLastName(potentialBeneficiaryLastName: string) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      potentialBeneficiaryLastName,
    });
  }

  withPotentialBeneficiaryResumeLink(
    potentialBeneficiaryResumeLink: string | undefined,
  ) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      potentialBeneficiaryResumeLink,
    });
  }

  withAppellationCode(appellationCode: AppellationCode) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      appellationCode,
    });
  }

  withSiret(siret: SiretDto) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      siret,
    });
  }

  withImmersionObjective(immersionObjective: ImmersionObjective | null) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      immersionObjective,
    });
  }

  withCreatedAt(createdAt: Date) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      createdAt,
    });
  }

  withExchanges(exchanges: ExchangeEntity[]) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      exchanges,
    });
  }

  build() {
    return this.discussionAggregate;
  }
}
