import {
  InclusionConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { GetUsers, makeGetUsers } from "./GetUsers";

const randomUser = new InclusionConnectedUserBuilder()
  .withId("not-admin-id")
  .withIsAdmin(false)
  .build();

const adminUser = new InclusionConnectedUserBuilder()
  .withId("admin-id")
  .withIsAdmin(true)
  .build();

describe("GetUsers", () => {
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
