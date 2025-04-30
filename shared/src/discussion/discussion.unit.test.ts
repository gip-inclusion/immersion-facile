import { expectToEqual } from "../test.helpers";
import { DiscussionBuilder, type DiscussionReadDto } from "./discussion.dto";
import { discussionReadSchema } from "./discussion.schema";

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
