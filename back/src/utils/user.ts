import { InclusionConnectedUserBuilder } from "shared";

export const makeUniqueUserForTest = (userId: string) =>
  new InclusionConnectedUserBuilder()
    .withId(userId)
    .withEmail(`${userId}@mail.com`)
    .buildUser();
