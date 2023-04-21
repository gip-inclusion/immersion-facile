import { AuthenticatedUser, expectPromiseToFailWith } from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { GetInclusionConnectedUsers } from "./GetInclusionConnectedUsers";

const userId = "123";
const _john: AuthenticatedUser = {
  id: userId,
  email: "john@mail.com",
  firstName: "John",
  lastName: "Doe",
};

describe("GetInclusionConnectedUsers", () => {
  let getInclusionConnectedUser: GetInclusionConnectedUsers;
  let uowPerformer: InMemoryUowPerformer;
  // let inclusionConnectedUserRepository: InMemoryInclusionConnectedUserRepository;

  beforeEach(() => {
    const uow = createInMemoryUow();
    // inclusionConnectedUserRepository = uow.inclusionConnectedUserRepository;
    uowPerformer = new InMemoryUowPerformer(uow);
    getInclusionConnectedUser = new GetInclusionConnectedUsers(uowPerformer);
  });

  it("throws Forbidden if no jwt token provided", async () => {
    await expectPromiseToFailWith(
      getInclusionConnectedUser.execute({ agencyRole: "toReview" }),
      "No JWT token provided",
    );
  });

  it("throws Forbidden if token payload is not backoffice token", async () => {
    await expectPromiseToFailWith(
      getInclusionConnectedUser.execute({ agencyRole: "toReview" }, {
        role: "validator",
      } as any),
      "This user is not a backOffice user, role was : 'validator'",
    );
  });

  // it("todo", () => {
  //   inclusionConnectedUserRepository.agenciesByUserId
  // })
});
