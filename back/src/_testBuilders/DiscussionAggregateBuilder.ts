import {
  AddressDto,
  AppellationCode,
  Builder,
  DiscussionId,
  ImmersionObjective,
  SiretDto,
} from "shared";
import {
  DiscussionAggregate,
  DiscussionEstablishmentContact,
  DiscussionPotentialBeneficiary,
  ExchangeEntity,
} from "../domain/offer/entities/DiscussionAggregate";

const createdAt = new Date("2023-06-23T12:00:00.000");

const defaultDiscussionAggregateV2: DiscussionAggregate = {
  id: "9f6dad2c-6f02-11ec-90d6-0242ac120003",
  appellationCode: "11704",
  siret: "12345671234567",
  createdAt,
  immersionObjective: "Confirmer un projet professionnel",
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
    phone: "06545334567",
    resumeLink: undefined,
  },
  establishmentContact: {
    contactMethod: "EMAIL",
    email: "estab@mail.com",
    copyEmails: ["copy@yolo.com"],
    firstName: "estab",
    lastName: "lishment",
    job: "job",
    phone: "06545334567",
  },
  exchanges: [
    {
      subject: "Sujet de discussion",
      sentAt: createdAt,
      sender: "potentialBeneficiary",
      message: "default message",
      recipient: "establishment",
    },
  ],
};

export class DiscussionAggregateBuilder
  implements Builder<DiscussionAggregate>
{
  constructor(
    private readonly discussionAggregate: DiscussionAggregate = defaultDiscussionAggregateV2,
  ) {}

  build() {
    return this.discussionAggregate;
  }

  withAddress(address: AddressDto) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      address,
    });
  }

  withAppellationCode(appellationCode: AppellationCode) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      appellationCode,
    });
  }

  withCreatedAt(createdAt: Date) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      createdAt,
    });
  }

  withEstablishmentContact(
    establishmentContact: Partial<DiscussionEstablishmentContact>,
  ) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      establishmentContact: {
        ...this.discussionAggregate.establishmentContact,
        ...establishmentContact,
      },
    });
  }

  withExchanges(exchanges: ExchangeEntity[]) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      exchanges,
    });
  }

  withId(id: DiscussionId) {
    return new DiscussionAggregateBuilder({ ...this.discussionAggregate, id });
  }

  withImmersionObjective(immersionObjective: ImmersionObjective | null) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      immersionObjective,
    });
  }

  withPotentialBeneficiary(
    potentialBeneficiary: Partial<DiscussionPotentialBeneficiary>,
  ) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      potentialBeneficiary: {
        ...this.discussionAggregate.potentialBeneficiary,
        ...potentialBeneficiary,
      },
    });
  }

  withSiret(siret: SiretDto) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      siret,
    });
  }
}
