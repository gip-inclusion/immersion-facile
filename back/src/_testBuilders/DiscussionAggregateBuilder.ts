// TODO : create a DiscussionAggregateBuilder
import { ApplicationCode } from "aws-sdk/clients/kinesisanalytics";
import { ImmersionObjective, SiretDto } from "shared";
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
  createdAt,
}: {
  id: string;
  siret: SiretDto;
  potentialBeneficiaryPhone: string;
  immersionObjective: ImmersionObjective | null;
  appellationCode: ApplicationCode;
  potentialBeneficiaryResumeLink?: string;
  createdAt: Date;
}): DiscussionAggregate => ({
  id,
  appellationCode,
  siret,
  createdAt,
  immersionObjective,
  potentialBeneficiary: {
    firstName: "Claire",
    lastName: "Bertrand",
    email: "claire.bertrand@email.fr",
    phone: potentialBeneficiaryPhone,
    resumeLink: potentialBeneficiaryResumeLink,
  },
  establishmentContact: {
    contactMode: "EMAIL",
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
