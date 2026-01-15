import { type ConventionDraftDto, ConventionDtoBuilder } from "shared";
import { v4 as uuid } from "uuid";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type DeleteConventionDraft,
  makeDeleteConventionDraft,
} from "./DeleteConventionDraft";

describe("DeleteConventionDraft", () => {
  let uow: InMemoryUnitOfWork;
  let usecase: DeleteConventionDraft;

  beforeEach(() => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    usecase = makeDeleteConventionDraft({ uowPerformer });
  });

  it("deletes a convention draft", async () => {
    const now = "2024-10-08T00:00:00.000Z";
    const conventionDraft: ConventionDraftDto = {
      id: uuid(),
      internshipKind: "immersion",
    };
    await uow.conventionDraftRepository.save(conventionDraft, now);

    await usecase.execute({
      fromConventionDraftId: conventionDraft.id,
      convention: new ConventionDtoBuilder().build(),
    });

    expect(
      await uow.conventionDraftRepository.getById(conventionDraft.id),
    ).toBeUndefined();
  });
});
