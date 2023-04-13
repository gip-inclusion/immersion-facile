import isAfter from "date-fns/isAfter";

import { SiretDto } from "shared";

import {
  DiscussionAggregate,
  DiscussionId,
} from "../../../domain/immersionOffer/entities/DiscussionAggregate";
import { DiscussionAggregateRepository } from "../../../domain/immersionOffer/ports/DiscussionAggregateRepository";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

type DiscussionsById = Record<DiscussionId, DiscussionAggregate>;

export class InMemoryDiscussionAggregateRepository
  implements DiscussionAggregateRepository
{
  constructor(private _discussionAggregates: DiscussionsById = {}) {}

  public async insertDiscussionAggregate(
    discussionAggregate: DiscussionAggregate,
  ) {
    logger.info(discussionAggregate, "insertDiscussionAggregate");
    this._discussionAggregates[discussionAggregate.id] = discussionAggregate;
  }

  public async retrieveDiscussionAggregate(discussionId: DiscussionId) {
    return this._discussionAggregates[discussionId];
  }

  public async countDiscussionsForSiretSince(siret: SiretDto, since: Date) {
    return this.discussionAggregates.filter(
      (discussion) =>
        discussion.siret === siret && isAfter(discussion.createdAt, since),
    ).length;
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
