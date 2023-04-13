import { SiretDto } from "shared";
import {
  DiscussionAggregate,
  DiscussionId,
} from "../entities/DiscussionAggregate";

export interface DiscussionAggregateRepository {
  insertDiscussionAggregate: (
    discussionAggregate: DiscussionAggregate,
  ) => Promise<void>;
  retrieveDiscussionAggregate: (
    discussionId: DiscussionId,
  ) => Promise<DiscussionAggregate | undefined>;
  countDiscussionsForSiretSince: (
    siret: SiretDto,
    since: Date,
  ) => Promise<number>;
}
