import isAfter from "date-fns/isAfter";
import { AppellationCode, DiscussionId, Email, SiretDto } from "shared";
import { DiscussionAggregate } from "../../../domain/immersionOffer/entities/DiscussionAggregate";
import { DiscussionAggregateRepository } from "../../../domain/immersionOffer/ports/DiscussionAggregateRepository";

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
