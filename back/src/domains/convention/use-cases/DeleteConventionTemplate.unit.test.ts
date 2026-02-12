import type { ConventionTemplateId } from "shared";
import {
  ConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { makeDeleteConventionTemplate } from "./DeleteConventionTemplate";

describe("DeleteConventionTemplate", () => {
  const templateId =
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" as ConventionTemplateId;
  const currentUser = new ConnectedUserBuilder()
    .withId("user-id")
    .withEmail("user@example.com")
    .build();
  const otherUser = new ConnectedUserBuilder()
    .withId("other-user-id")
    .withEmail("other@example.com")
    .build();

  let uow: InMemoryUnitOfWork;
  let deleteConventionTemplate: ReturnType<typeof makeDeleteConventionTemplate>;

  beforeEach(() => {
    uow = createInMemoryUow();
    const timeGateway = new CustomTimeGateway();
    const uuidGenerator = new TestUuidGenerator();
    deleteConventionTemplate = makeDeleteConventionTemplate({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        createNewEvent: makeCreateNewEvent({ timeGateway, uuidGenerator }),
      },
    });
  });

  it("deletes the convention template when it belongs to current user", async () => {
    uow.conventionTemplateQueries.conventionTemplates = [
      {
        id: templateId,
        name: "Mon modèle",
        internshipKind: "immersion",
        userId: currentUser.id,
      },
    ];

    await deleteConventionTemplate.execute(
      { conventionTemplateId: templateId },
      currentUser,
    );

    expectToEqual(
      await uow.conventionTemplateQueries.get({
        ids: [templateId],
      }),
      [],
    );
  });

  it("throws notFound when template does not exist", async () => {
    await expectPromiseToFailWithError(
      deleteConventionTemplate.execute(
        { conventionTemplateId: templateId },
        currentUser,
      ),
      errors.conventionTemplate.notFound({ conventionTemplateId: templateId }),
    );
  });

  it("throws notFound when template belongs to another user", async () => {
    uow.conventionTemplateQueries.conventionTemplates = [
      {
        id: templateId,
        name: "Mon modèle",
        internshipKind: "immersion",
        userId: otherUser.id,
      },
    ];

    await expectPromiseToFailWithError(
      deleteConventionTemplate.execute(
        { conventionTemplateId: templateId },
        currentUser,
      ),
      errors.conventionTemplate.forbiddenToDeleteNotOwnedTemplate({
        conventionTemplateId: templateId,
      }),
    );
  });
});
