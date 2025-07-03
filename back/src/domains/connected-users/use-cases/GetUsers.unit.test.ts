import {
  ConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { type GetUsers, makeGetUsers } from "./GetUsers";

describe("GetUsers", () => {
  const randomUser = new ConnectedUserBuilder()
    .withId("not-admin-id")
    .withIsAdmin(false)
    .build();

  const adminUser = new ConnectedUserBuilder()
    .withId("admin-id")
    .withIsAdmin(true)
    .build();

  let getUsers: GetUsers;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    getUsers = makeGetUsers({ uowPerformer });
  });

  it("throws if user is not admin", async () => {
    await expectPromiseToFailWithError(
      getUsers.execute({ emailContains: "yolo" }, randomUser),
      errors.user.forbidden({ userId: randomUser.id }),
    );
  });

  it("works for admins", async () => {
    const users = await getUsers.execute({ emailContains: "yolo" }, adminUser);
    expectToEqual(users, []);
  });

  //TODO : c'est pas un peu trop léger comme test suite?
});
