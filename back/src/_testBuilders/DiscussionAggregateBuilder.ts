// TODO : create a DiscussionAggregateBuilder
import { ApplicationCode } from "aws-sdk/clients/kinesisanalytics";
import { AddressDto, Email, ImmersionObjective, SiretDto } from "shared";
import { DiscussionAggregate } from "../domain/immersionOffer/entities/DiscussionAggregate";

// TODO transform this function into a DiscussionAggregateBuilder
// (Clément whishes to do it)

// exemple to start :
// export class DiscussionAggregateBuilder implements Builder<DiscussionAggregate> {...}

export const createDiscussionAggregate = ({
  id,
  siret,
  immersionObjective,
  potentialBeneficiaryResumeLink,
  potentialBeneficiaryPhone,
  appellationCode,
  establishmentContact = {},
  address,
  createdAt,
}: {
  id: string;
  siret: SiretDto;
  potentialBeneficiaryPhone: string;
  immersionObjective: ImmersionObjective | null;
  appellationCode: ApplicationCode;
  potentialBeneficiaryResumeLink?: string;
  address?: AddressDto;
  establishmentContact?: Partial<{
    email: Email;
    firstName: string;
    lastName: string;
    phone: string;
    job: string;
    copyEmails: string[];
  }>;
  createdAt: Date;
}): DiscussionAggregate => ({
  id,
  appellationCode,
  siret,
  createdAt,
  immersionObjective,
  address: address ?? {
    streetNumberAndAddress: "1 rue de la Paix",
    postcode: "75001",
    departmentCode: "75",
    city: "Paris",
  },
  potentialBeneficiary: {
    firstName: "Claire",
    lastName: "Bertrand",
    email: "claire.bertrand@email.fr",
    phone: potentialBeneficiaryPhone,
    resumeLink: potentialBeneficiaryResumeLink,
  },
  establishmentContact: {
    contactMode: "EMAIL",
    email: establishmentContact.email ?? "establishment@mail.com",
    firstName: establishmentContact.firstName ?? "Jean",
    lastName: establishmentContact.lastName ?? "Dupont",
    phone: establishmentContact.phone ?? "0123456789",
    job: establishmentContact.job ?? "Directeur",
    copyEmails: establishmentContact.copyEmails ?? [],
  },
  exchanges: [
    {
      sentAt: createdAt,
      message: "Bonjour ! J'aimerais faire une immersion.",
      recipient: "establishment",
      sender: "potentialBeneficiary",
    },
  ],
});
