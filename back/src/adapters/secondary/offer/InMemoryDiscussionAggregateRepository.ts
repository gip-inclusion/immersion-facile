import isAfter from "date-fns/isAfter";
import {
  AddressDto,
  AppellationCode,
  Builder,
  DiscussionId,
  Email,
  ImmersionObjective,
  SiretDto,
} from "shared";
import {
  DiscussionAggregate,
  DiscussionEstablishmentContact,
  DiscussionPotentialBeneficiary,
  ExchangeEntity,
} from "../../../domain/offer/entities/DiscussionAggregate";
import { DiscussionAggregateRepository } from "../../../domain/offer/ports/DiscussionAggregateRepository";

type DiscussionsById = Record<DiscussionId, DiscussionAggregate>;

export class InMemoryDiscussionAggregateRepository
  implements DiscussionAggregateRepository
{
  constructor(private _discussionAggregates: DiscussionsById = {}) {}

  public async countDiscussionsForSiretSince(siret: SiretDto, since: Date) {
    return this.discussionAggregates.filter(
      (discussion) =>
        discussion.siret === siret && isAfter(discussion.createdAt, since),
    ).length;
  }

  public async getById(discussionId: DiscussionId) {
    return this._discussionAggregates[discussionId];
  }

  public async hasDiscussionMatching({
    siret,
    appellationCode,
    potentialBeneficiaryEmail,
    since,
  }: {
    potentialBeneficiaryEmail: Email;
    appellationCode: AppellationCode;
    siret: SiretDto;
    since: Date;
  }): Promise<boolean> {
    return this.discussionAggregates.some(
      (discussion) =>
        discussion.siret === siret &&
        discussion.appellationCode === appellationCode &&
        discussion.potentialBeneficiary.email === potentialBeneficiaryEmail &&
        discussion.createdAt >= since,
    );
  }

  public async insert(discussionAggregate: DiscussionAggregate) {
    this._discussionAggregates[discussionAggregate.id] = discussionAggregate;
  }

  public async update(discussionAggregate: DiscussionAggregate) {
    if (!this._discussionAggregates[discussionAggregate.id])
      throw new Error("DiscussionAggregate not found");
    this._discussionAggregates[discussionAggregate.id] = discussionAggregate;
  }

  // For test purposes
  public get discussionAggregates(): DiscussionAggregate[] {
    return Object.values(this._discussionAggregates);
  }

  public set discussionAggregates(discussions: DiscussionAggregate[]) {
    this._discussionAggregates = discussions.reduce(
      (acc, discussion) => ({ ...acc, [discussion.id]: discussion }),
      {} as DiscussionsById,
    );
  }
}

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

  public build() {
    return this.discussionAggregate;
  }

  public withAddress(address: AddressDto) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      address,
    });
  }

  public withAppellationCode(appellationCode: AppellationCode) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      appellationCode,
    });
  }

  public withCreatedAt(createdAt: Date) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      createdAt,
    });
  }

  public withEstablishmentContact(
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

  public withExchanges(exchanges: ExchangeEntity[]) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      exchanges,
    });
  }

  public withId(id: DiscussionId) {
    return new DiscussionAggregateBuilder({ ...this.discussionAggregate, id });
  }

  public withImmersionObjective(immersionObjective: ImmersionObjective | null) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      immersionObjective,
    });
  }

  public withPotentialBeneficiary(
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

  public withSiret(siret: SiretDto) {
    return new DiscussionAggregateBuilder({
      ...this.discussionAggregate,
      siret,
    });
  }
}
