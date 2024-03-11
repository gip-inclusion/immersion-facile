import isAfter from "date-fns/isAfter";
import {
  AddressDto,
  AppellationCode,
  Builder,
  DiscussionDto,
  DiscussionEstablishmentContact,
  DiscussionId,
  DiscussionPotentialBeneficiary,
  Exchange,
  ImmersionObjective,
  SiretDto,
} from "shared";
import {
  DiscussionRepository,
  HasDiscussionMatchingParams,
} from "../ports/DiscussionRepository";

type DiscussionsById = Record<DiscussionId, DiscussionDto>;

export class InMemoryDiscussionRepository implements DiscussionRepository {
  constructor(private _discussions: DiscussionsById = {}) {}

  public async countDiscussionsForSiretSince(siret: SiretDto, since: Date) {
    return this.discussions.filter(
      (discussion) =>
        discussion.siret === siret &&
        isAfter(new Date(discussion.createdAt), since),
    ).length;
  }

  public async getById(discussionId: DiscussionId) {
    return this._discussions[discussionId];
  }

  public async hasDiscussionMatching({
    siret,
    appellationCode,
    potentialBeneficiaryEmail,
    since,
    establishmentRepresentativeEmail,
  }: Partial<HasDiscussionMatchingParams>): Promise<boolean> {
    const filters = [
      (discussion: DiscussionDto) =>
        siret ? discussion.siret === siret : true,
      (discussion: DiscussionDto) =>
        appellationCode ? discussion.appellationCode === appellationCode : true,
      (discussion: DiscussionDto) =>
        potentialBeneficiaryEmail
          ? discussion.potentialBeneficiary.email === potentialBeneficiaryEmail
          : true,
      (discussion: DiscussionDto) =>
        since ? new Date(discussion.createdAt) >= since : true,
      (discussion: DiscussionDto) =>
        establishmentRepresentativeEmail
          ? discussion.establishmentContact.email ===
            establishmentRepresentativeEmail
          : true,
    ];
    return this.discussions.some((discussion) =>
      filters.every((filter) => filter(discussion)),
    );
  }

  public async insert(discussion: DiscussionDto) {
    this._discussions[discussion.id] = discussion;
  }

  public async update(discussion: DiscussionDto) {
    if (!this._discussions[discussion.id])
      throw new Error("Discussion not found");
    this._discussions[discussion.id] = discussion;
  }

  // For test purposes
  public get discussions(): DiscussionDto[] {
    return Object.values(this._discussions);
  }

  public set discussions(discussions: DiscussionDto[]) {
    this._discussions = discussions.reduce(
      (acc, discussion) => ({ ...acc, [discussion.id]: discussion }),
      {} as DiscussionsById,
    );
  }
}

const createdAt = new Date("2023-06-23T12:00:00.000").toISOString();

const defaultDiscussion: DiscussionDto = {
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

export class DiscussionBuilder implements Builder<DiscussionDto> {
  constructor(private readonly discussion: DiscussionDto = defaultDiscussion) {}

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

  public withCreatedAt(createdAt: Date) {
    return new DiscussionBuilder({
      ...this.discussion,
      createdAt: createdAt.toISOString(),
    });
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
    return new DiscussionBuilder({
      ...this.discussion,
      immersionObjective,
    });
  }

  public withPotentialBeneficiary(
    potentialBeneficiary: Partial<DiscussionPotentialBeneficiary>,
  ) {
    return new DiscussionBuilder({
      ...this.discussion,
      potentialBeneficiary: {
        ...this.discussion.potentialBeneficiary,
        ...potentialBeneficiary,
      },
    });
  }

  public withSiret(siret: SiretDto) {
    return new DiscussionBuilder({
      ...this.discussion,
      siret,
    });
  }
}
