import {
  type ConventionDraftDto,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { makeGetConventionDraftById } from "./GetConventionDraftById";

describe("GetConventionDraftById", () => {
  let uow: InMemoryUnitOfWork;
  let usecase: ReturnType<typeof makeGetConventionDraftById>;

  beforeEach(() => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    usecase = makeGetConventionDraftById({ uowPerformer });
  });

  it("returns the convention draft when it exists", async () => {
    const now = new Date().toISOString();
    const conventionDraft: ConventionDraftDto = {
      id: uuid(),
      internshipKind: "immersion",
    };
    await uow.conventionDraftRepository.save(conventionDraft, now);

    const result = await usecase.execute(conventionDraft.id);

    expectToEqual(result, {
      ...conventionDraft,
      updatedAt: now,
    });
  });

  it("throws NotFoundError when convention draft does not exist", async () => {
    const nonExistentId = uuid();

    await expectPromiseToFailWithError(
      usecase.execute(nonExistentId),
      errors.conventionDraft.notFound({ conventionDraftId: nonExistentId }),
    );
  });
});
