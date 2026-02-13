import type {
  ConnectedUser,
  ConventionTemplate,
  ConventionTemplateId,
} from "shared";
import {
  ConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  type CreateOrUpdateConventionTemplate,
  makeCreateOrUpdateConventionTemplate,
} from "./CreateOrUpdateConventionTemplate";

describe("CreateOrUpdateConventionTemplate", () => {
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
  const conventionTemplate: ConventionTemplate = {
    id: templateId,
    name: "Mon modèle",
    internshipKind: "immersion",
    userId: currentUser.id,
  };

  let uow: InMemoryUnitOfWork;
  let createOrUpdateConventionTemplate: CreateOrUpdateConventionTemplate;
  let timeGateway: TimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    createOrUpdateConventionTemplate = makeCreateOrUpdateConventionTemplate({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        timeGateway,
        createNewEvent: makeCreateNewEvent({
          timeGateway,
          uuidGenerator: new TestUuidGenerator(),
        }),
      },
    });
  });

  it("upserts the convention template when user is authenticated", async () => {
    const resultBeforeCreation = await uow.conventionTemplateQueries.get({
      ids: [templateId],
    });
    expect(resultBeforeCreation).toHaveLength(0);

    await createOrUpdateConventionTemplate.execute(
      conventionTemplate,
      currentUser,
    );

    const resultAfterCreation = await uow.conventionTemplateQueries.get({
      ids: [templateId],
    });
    expect(resultAfterCreation).toHaveLength(1);
    expectToEqual(resultAfterCreation[0], {
      ...conventionTemplate,
      userId: currentUser.id,
    });
  });

  it("throws unauthorized when current user is undefined", async () => {
    await expectPromiseToFailWithError(
      createOrUpdateConventionTemplate.execute(
        conventionTemplate,
        undefined as unknown as ConnectedUser,
      ),
      errors.user.unauthorized(),
    );
  });

  it("throws forbidden when updating a template owned by another user", async () => {
    uow.conventionTemplateQueries.conventionTemplates = [
      {
        id: templateId,
        name: "Mon modèle",
        internshipKind: "immersion",
        userId: otherUser.id,
      },
    ];

    await expectPromiseToFailWithError(
      createOrUpdateConventionTemplate.execute(
        { ...conventionTemplate, name: "Updated name" },
        currentUser,
      ),
      errors.conventionTemplate.forbidden({
        conventionTemplateId: templateId,
      }),
    );
  });
});
