import isAfter from "date-fns/isAfter";
import { DiscussionDto, DiscussionId, SiretDto } from "shared";
import {
  DiscussionRepository,
  GetDiscussionsParams,
  HasDiscussionMatchingParams,
} from "../ports/DiscussionRepository";

type DiscussionsById = Record<DiscussionId, DiscussionDto>;

export class InMemoryDiscussionRepository implements DiscussionRepository {
  constructor(private _discussions: DiscussionsById = {}) {}

  public discussionCallsCount = 0;

  public async getDiscussions({
    filters,
    limit,
  }: GetDiscussionsParams): Promise<DiscussionDto[]> {
    this.discussionCallsCount++;
    const discussionFilters: Array<(discussion: DiscussionDto) => boolean> = [
      ({ siret }) =>
        filters.sirets && siret.length > 0
          ? filters.sirets.includes(siret)
          : true,
      ({ createdAt }) =>
        filters.createdSince
          ? new Date(createdAt) >= filters.createdSince
          : true,
      ({ status }) => (filters.status ? status === filters.status : true),
      ({ exchanges }) => {
        if (!filters.lastAnsweredByCandidate) return true;
        const mostRecentExchange = exchanges.reduce((a, b) =>
          a.sentAt > b.sentAt ? a : b,
        );
        const sendAt = new Date(mostRecentExchange.sentAt);

        return (
          mostRecentExchange.sender === "potentialBeneficiary" &&
          sendAt >= filters.lastAnsweredByCandidate.from &&
          sendAt <= filters.lastAnsweredByCandidate.to
        );
      },
    ];
    const discussions = this.discussions
      .filter((discussion) =>
        discussionFilters.every((filter) => filter(discussion)),
      )
      .slice(0, limit);

    return discussions;
  }

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
