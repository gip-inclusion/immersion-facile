// TODO : create a DiscussionAggregateBuilder
import { SiretDto } from "shared";

import { DiscussionAggregate } from "../domain/immersionOffer/entities/DiscussionAggregate";

// TODO transform this function into a DiscussionAggregateBuilder
// (Clément whishes to do it)

// exemple to start :
// export class DiscussionAggregateBuilder implements Builder<DiscussionAggregate> {...}

export const createDiscussionAggregate = ({
  id,
  siret,
  createdAt,
}: {
  id: string;
  siret: SiretDto;
  createdAt: Date;
}): DiscussionAggregate => ({
  id,
  romeCode: "M1607",
  siret,
  contactMode: "EMAIL",
  createdAt,
  potentialBeneficiaryFirstName: "Claire",
  potentialBeneficiaryLastName: "Bertrand",
  potentialBeneficiaryEmail: "claire.bertrand@email.fr",
  exchanges: [
    {
      sentAt: createdAt,
      message: "Bonjour ! J'aimerais faire une immersion.",
      recipient: "establishment",
      sender: "potentialBeneficiary",
    },
  ],
});
