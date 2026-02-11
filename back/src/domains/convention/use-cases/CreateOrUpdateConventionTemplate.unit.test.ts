import type { ConventionTemplate, ConventionTemplateId } from "shared";
import {
  ConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { makeCreateOrUpdateConventionTemplate } from "./CreateOrUpdateConventionTemplate";

describe("CreateOrUpdateConventionTemplate", () => {
  const templateId =
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" as ConventionTemplateId;
  const currentUser = new ConnectedUserBuilder()
    .withId("user-id")
    .withEmail("user@example.com")
    .build();
  const conventionTemplate: ConventionTemplate = {
    id: templateId,
    name: "Mon modèle",
    internshipKind: "immersion",
    userId: currentUser.id,
  };

  let uow: InMemoryUnitOfWork;
  let createOrUpdateConventionTemplate: ReturnType<
    typeof makeCreateOrUpdateConventionTemplate
  >;
  let timeGateway: TimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    createOrUpdateConventionTemplate = makeCreateOrUpdateConventionTemplate({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: { timeGateway },
    });
  });

  it("upserts the convention template when user is authenticated", async () => {
    const resultBeforeCreation =
      await uow.conventionTemplateQueries.getById(templateId);
    expect(resultBeforeCreation).toBeUndefined();

    await createOrUpdateConventionTemplate.execute(
      conventionTemplate,
      currentUser,
    );

    const resultAfterCreation =
      await uow.conventionTemplateQueries.getById(templateId);
    expect(resultAfterCreation).toBeDefined();
    expectToEqual(resultAfterCreation, {
      ...conventionTemplate,
      userId: currentUser.id,
    });
  });

  it("throws unauthorized when current user is undefined", async () => {
    await expectPromiseToFailWithError(
      createOrUpdateConventionTemplate.execute(
        conventionTemplate,
        undefined as unknown as typeof currentUser,
      ),
      errors.user.unauthorized(),
    );
  });
});
