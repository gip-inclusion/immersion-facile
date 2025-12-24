import type { ConventionDraftDto, ConventionDraftId, DateString } from "shared";
import type { ConventionDraftRepository } from "../ports/ConventionDraftRepository";

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
    _: DateString,
  ): Promise<void> {
    this.#conventionDrafts[conventionDraft.id] = conventionDraft;
  }
}
