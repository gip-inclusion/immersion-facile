import { ConnectedUserBuilder } from "shared";

export const makeUniqueUserForTest = (userId: string) =>
  new ConnectedUserBuilder()
    .withId(userId)
    .withEmail(`${userId}@mail.com`)
    .buildUser();
