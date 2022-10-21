import {
  DiscussionId,
  DiscussionAggregate,
} from "../../../domain/immersionOffer/entities/DiscussionAggregate";
import { DiscussionAggregateRepository } from "../../../domain/immersionOffer/ports/DiscussionAggregateRepository";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class InMemoryDiscussionAggregateRepository
  implements DiscussionAggregateRepository
{
  constructor(
    private _discussionAggregates: Record<
      DiscussionId,
      DiscussionAggregate
    > = {},
  ) {}

  public async insertDiscussionAggregate(
    discussionAggregate: DiscussionAggregate,
  ) {
    logger.info(discussionAggregate, "insertDiscussionAggregate");
    this._discussionAggregates[discussionAggregate.id] = discussionAggregate;
  }
  public async retrieveDiscussionAggregate(discussionId: DiscussionId) {
    return this._discussionAggregates[discussionId];
  }
  // For test purposes
  public get discussionAggregates(): DiscussionAggregate[] {
    return Object.values(this._discussionAggregates);
  }
}
