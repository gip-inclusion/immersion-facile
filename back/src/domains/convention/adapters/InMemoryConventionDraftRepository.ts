import type { ConventionDraftDto, ConventionDraftId, DateString } from "shared";
import type {
  ConventionDraftRepository,
  DeleteConventionDraftFilters,
} from "../ports/ConventionDraftRepository";

export class InMemoryConventionDraftRepository
  implements ConventionDraftRepository
{
  #conventionDrafts: Record<ConventionDraftId, ConventionDraftDto> = {};

  public set conventionDrafts(conventionDrafts: ConventionDraftDto[]) {
    this.#conventionDrafts = conventionDrafts.reduce(
      (acc, draft) => ({ ...acc, [draft.id]: draft }),
      {} as Record<ConventionDraftId, ConventionDraftDto>,
    );
  }

  public async getById(
    id: ConventionDraftId,
  ): Promise<ConventionDraftDto | undefined> {
    return this.#conventionDrafts[id];
  }

  public async save(
    conventionDraft: ConventionDraftDto,
    updatedAt: DateString,
  ): Promise<void> {
    this.#conventionDrafts[conventionDraft.id] = {
      ...conventionDraft,
      updatedAt,
    };
  }

  public async delete(
    filters: DeleteConventionDraftFilters,
  ): Promise<ConventionDraftId[]> {
    const conventionDraftsIdsToDelete = Object.entries(this.#conventionDrafts)
      .filter(
        ([id, draft]) =>
          shouldDeleteById(id, filters.ids) ||
          shouldDeleteByDate(draft, filters.endedSince),
      )
      .map(([id]) => id);

    conventionDraftsIdsToDelete.forEach((id) => {
      delete this.#conventionDrafts[id];
    });

    return conventionDraftsIdsToDelete;
  }
}

const shouldDeleteById = (
  id: ConventionDraftId,
  idsToDelete?: ConventionDraftId[],
): boolean => !idsToDelete || idsToDelete.includes(id);

const shouldDeleteByDate = (
  draft: ConventionDraftDto,
  endedSince?: Date,
): boolean =>
  !endedSince || (!!draft.updatedAt && new Date(draft.updatedAt) <= endedSince);
