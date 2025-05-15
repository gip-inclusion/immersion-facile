import { expectToEqual } from "../test.helpers";
import { DiscussionBuilder, type DiscussionReadDto } from "./discussion.dto";
import {
  discussionReadSchema,
  makeExchangeEmailSchema,
} from "./discussion.schema";

describe("Discussion schema", () => {
  const discussionEmailIF = new DiscussionBuilder()
    .withContactMode("EMAIL")
    .withDiscussionKind("IF")
    .build();

  const discussionEmail1E1S = new DiscussionBuilder()
    .withContactMode("EMAIL")
    .withDiscussionKind("1_ELEVE_1_STAGE")
    .build();

  const discussionPhoneIF = new DiscussionBuilder()
    .withContactMode("PHONE")
    .withDiscussionKind("IF")
    .build();

  const discussionPhone1E1S = new DiscussionBuilder()
    .withContactMode("PHONE")
    .withDiscussionKind("1_ELEVE_1_STAGE")
    .build();

  const discussionInPersonIF = new DiscussionBuilder()
    .withContactMode("IN_PERSON")
    .withDiscussionKind("IF")
    .build();

  const discussionInPerson1E1S = new DiscussionBuilder()
    .withContactMode("IN_PERSON")
    .withDiscussionKind("1_ELEVE_1_STAGE")
    .build();

  it.each([
    discussionEmailIF,
    discussionEmail1E1S,
    discussionInPerson1E1S,
    discussionInPersonIF,
    discussionPhone1E1S,
    discussionPhoneIF,
  ])(
    "Test discussionReadSchema",
    ({ establishmentContact, appellationCode, ...rest }) => {
      const discussionRead: DiscussionReadDto = {
        ...rest,
        establishmentContact: {
          firstName: establishmentContact.firstName,
          lastName: establishmentContact.lastName,
          job: establishmentContact.job,
        },
        appellation: {
          appellationCode: appellationCode,
          appellationLabel: "osef",
          romeCode: "A2023",
          romeLabel: "osef",
        },
      };

      expectToEqual(discussionReadSchema.parse(discussionRead), discussionRead);
    },
  );
});
describe("makeExchangeEmailSchema", () => {
  it("should parse the email", () => {
    const email = "firstname_lastname__discussionId_e@reply.domain.com";
    const result = makeExchangeEmailSchema("reply.domain.com").parse(email);
    expectToEqual(result, {
      firstname: "firstname",
      lastname: "lastname",
      discussionId: "discussionId",
      rawRecipientKind: "e",
    });
  });
  it("should parse the email even if recipient kind is not known", () => {
    const email = "firstname_lastname__discussionId_bob@reply.domain.com";
    const result = makeExchangeEmailSchema("reply.domain.com").parse(email);
    expectToEqual(result, {
      firstname: "firstname",
      lastname: "lastname",
      discussionId: "discussionId",
      rawRecipientKind: "bob",
    });
  });
  it("should throw an error if the email is not valid", () => {
    const email = "john_doe_discussionId_bob@reply.domain.com";
    expect(() =>
      makeExchangeEmailSchema("reply.domain.com").parse(email),
    ).toThrow();
  });
});
