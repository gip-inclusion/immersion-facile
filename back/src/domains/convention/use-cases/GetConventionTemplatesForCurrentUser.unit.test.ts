import type { ConventionTemplate, ConventionTemplateId } from "shared";
import { ConnectedUserBuilder, expectToEqual } from "shared";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { makeGetConventionTemplatesForCurrentUser } from "./GetConventionTemplatesForCurrentUser";

describe("GetConventionTemplatesForCurrentUser", () => {
  const currentUser = new ConnectedUserBuilder()
    .withId("user-id")
    .withEmail("user@example.com")
    .build();
  const otherUser = new ConnectedUserBuilder()
    .withId("other-user-id")
    .withEmail("other@example.com")
    .build();
  const currentUserTemplate1: ConventionTemplate = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" as ConventionTemplateId,
    name: "Modèle 1",
    internshipKind: "immersion",
    userId: currentUser.id,
  };
  const currentUserTemplate2: ConventionTemplate = {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" as ConventionTemplateId,
    name: "Modèle 2",
    internshipKind: "immersion",
    userId: currentUser.id,
  };
  const otherUserTemplate: ConventionTemplate = {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" as ConventionTemplateId,
    name: "Other user template",
    internshipKind: "immersion",
    userId: otherUser.id,
  };

  let uow: InMemoryUnitOfWork;
  let getConventionTemplatesForCurrentUser: ReturnType<
    typeof makeGetConventionTemplatesForCurrentUser
  >;

  beforeEach(() => {
    uow = createInMemoryUow();
    getConventionTemplatesForCurrentUser =
      makeGetConventionTemplatesForCurrentUser({
        uowPerformer: new InMemoryUowPerformer(uow),
      });
  });

  it("returns convention templates for the current user only", async () => {
    uow.conventionTemplateQueries.conventionTemplates = [
      currentUserTemplate1,
      currentUserTemplate2,
      otherUserTemplate,
    ];

    const result = await getConventionTemplatesForCurrentUser.execute(
      undefined,
      currentUser,
    );

    expectToEqual(result, [currentUserTemplate1, currentUserTemplate2]);
  });

  it("returns empty array when user has no templates", async () => {
    uow.conventionTemplateQueries.conventionTemplates = [otherUserTemplate];

    const result = await getConventionTemplatesForCurrentUser.execute(
      undefined,
      currentUser,
    );

    expectToEqual(result, []);
  });
});
