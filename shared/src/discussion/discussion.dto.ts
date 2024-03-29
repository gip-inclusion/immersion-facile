import { Builder } from "../Builder";
import { WithAcquisition } from "../acquisition.dto";
import { AddressDto } from "../address/address.dto";
import { ImmersionObjective } from "../convention/convention.dto";
import { ContactMethod } from "../formEstablishment/FormEstablishment.dto";
import {
  AppellationAndRomeDto,
  AppellationCode,
} from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { SiretDto } from "../siret/siret";
import { Flavor } from "../typeFlavors";
import { includesTypeGuard } from "../typeGuard";
import { OmitFromExistingKeys } from "../utils";
import { DateString } from "../utils/date";

export const exchangeRoles = ["establishment", "potentialBeneficiary"] as const;
export type ExchangeRole = (typeof exchangeRoles)[number];
export const isExchangeRole = includesTypeGuard(exchangeRoles);

export type DiscussionId = Flavor<string, "DiscussionId">;

export type DiscussionPotentialBeneficiary = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  resumeLink?: string;
};

export type DiscussionEstablishmentContact = {
  email: string;
  copyEmails: string[];
  firstName: string;
  lastName: string;
  phone: string;
  job: string;
  contactMethod: ContactMethod;
};

type DiscussionDtoBase = {
  id: DiscussionId;
  createdAt: DateString;
  siret: SiretDto;
  businessName: string;
  appellationCode: AppellationCode;
  immersionObjective: ImmersionObjective | null;
  address: AddressDto;
  exchanges: Exchange[];
  potentialBeneficiary: DiscussionPotentialBeneficiary;
};

export type DiscussionDto = DiscussionDtoBase & {
  establishmentContact: DiscussionEstablishmentContact;
} & WithAcquisition;

export type DiscussionReadDto = OmitFromExistingKeys<
  DiscussionDtoBase,
  "appellationCode"
> & {
  appellation: AppellationAndRomeDto;
} & {
  establishmentContact: OmitFromExistingKeys<
    DiscussionEstablishmentContact,
    "email" | "copyEmails" | "phone"
  >;
};

export type Exchange = {
  subject: string;
  message: string;
  sender: ExchangeRole;
  recipient: ExchangeRole;
  sentAt: DateString;
};

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

export const cartographeAppellationAndRome: AppellationAndRomeDto = {
  romeCode: "M1808",
  appellationCode: "11704",
  romeLabel: "Information géographique",
  appellationLabel: "Cartographe",
};

export class DiscussionBuilder implements Builder<DiscussionDto> {
  constructor(private readonly discussion: DiscussionDto = defaultDiscussion) {}

  public buildRead(
    appelation: AppellationAndRomeDto = cartographeAppellationAndRome,
  ): DiscussionReadDto {
    const { appellationCode, ...rest } = this.discussion;
    if (appelation.appellationCode !== appellationCode)
      throw new Error("Appelation code mismatch");
    return {
      ...rest,
      appellation: appelation,
      potentialBeneficiary: {
        firstName: this.discussion.potentialBeneficiary.firstName,
        lastName: this.discussion.potentialBeneficiary.lastName,
        resumeLink: this.discussion.potentialBeneficiary.resumeLink,
        email: this.discussion.potentialBeneficiary.email,
        phone: this.discussion.potentialBeneficiary.phone,
      },
      establishmentContact: {
        firstName: this.discussion.establishmentContact.firstName,
        lastName: this.discussion.establishmentContact.lastName,
        job: this.discussion.establishmentContact.job,
        contactMethod: this.discussion.establishmentContact.contactMethod,
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
