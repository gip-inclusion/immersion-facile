import {
  AgencyDtoBuilder,
  BackOfficeJwtPayload,
  expectPromiseToFailWith,
  expectToEqual,
  InclusionConnectedUser,
} from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryInclusionConnectedUserRepository } from "../../../adapters/secondary/InMemoryInclusionConnectedUserRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { GetInclusionConnectedUsers } from "./GetInclusionConnectedUsers";

const agency1 = new AgencyDtoBuilder().withId("agency-1").build();
const agency2 = new AgencyDtoBuilder().withId("agency-2").build();

const johnWithAgenciesToReview: InclusionConnectedUser = {
  id: "john-123",
  email: "john@mail.com",
  firstName: "John",
  lastName: "Lennon",
  agencyRights: [
    { agency: agency1, role: "toReview" },
    { agency: agency2, role: "validator" },
  ],
};

const paulWithAllAgenciesReviewed: InclusionConnectedUser = {
  id: "paul-456",
  email: "paul@mail.com",
  firstName: "Paul",
  lastName: "McCartney",
  agencyRights: [
    { agency: agency1, role: "counsellor" },
    { agency: agency2, role: "validator" },
  ],
};

describe("GetInclusionConnectedUsers", () => {
  let getInclusionConnectedUsers: GetInclusionConnectedUsers;
  let uowPerformer: InMemoryUowPerformer;
  let inclusionConnectedUserRepository: InMemoryInclusionConnectedUserRepository;

  beforeEach(() => {
    const uow = createInMemoryUow();
    inclusionConnectedUserRepository = uow.inclusionConnectedUserRepository;
    uowPerformer = new InMemoryUowPerformer(uow);
    getInclusionConnectedUsers = new GetInclusionConnectedUsers(uowPerformer);
  });

  it("throws Forbidden if no jwt token provided", async () => {
    await expectPromiseToFailWith(
      getInclusionConnectedUsers.execute({ agencyRole: "toReview" }),
      "No JWT token provided",
    );
  });

  it("throws Forbidden if token payload is not backoffice token", async () => {
    await expectPromiseToFailWith(
      getInclusionConnectedUsers.execute({ agencyRole: "toReview" }, {
        role: "validator",
      } as any),
      "This user is not a backOffice user, role was : 'validator'",
    );
  });

  it("gets the users which have at least one agency with the given role", async () => {
    inclusionConnectedUserRepository.setInclusionConnectedUsers([
      johnWithAgenciesToReview,
      paulWithAllAgenciesReviewed,
    ]);
    const users = await getInclusionConnectedUsers.execute(
      { agencyRole: "toReview" },
      {
        role: "backOffice",
      } as BackOfficeJwtPayload,
    );

    expectToEqual(users, [johnWithAgenciesToReview]);
  });
});
