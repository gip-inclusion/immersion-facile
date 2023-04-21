import {
  AgencyDtoBuilder,
  AgencyRole,
  AuthenticatedUser,
  BackOfficeJwtPayload,
  expectPromiseToFailWith,
  expectToEqual,
  InclusionConnectedUser,
} from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryInclusionConnectedUserRepository } from "../../../adapters/secondary/InMemoryInclusionConnectedUserRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { UpdateIcUserRoleForAgency } from "./UpdateIcUserRoleForAgency";

const user: AuthenticatedUser = {
  id: "john-123",
  email: "john@mail.com",
  firstName: "John",
  lastName: "Lennon",
};
describe("GetInclusionConnectedUsers", () => {
  let updateIcUserRoleForAgency: UpdateIcUserRoleForAgency;
  let uowPerformer: InMemoryUowPerformer;
  let inclusionConnectedUserRepository: InMemoryInclusionConnectedUserRepository;

  beforeEach(() => {
    const uow = createInMemoryUow();
    inclusionConnectedUserRepository = uow.inclusionConnectedUserRepository;
    uowPerformer = new InMemoryUowPerformer(uow);
    updateIcUserRoleForAgency = new UpdateIcUserRoleForAgency(uowPerformer);
  });

  it("throws Forbidden if no jwt token provided", async () => {
    await expectPromiseToFailWith(
      updateIcUserRoleForAgency.execute({
        role: "counsellor",
        agencyId: "agency-1",
        userId: "john-123",
      }),
      "No JWT token provided",
    );
  });

  it("throws Forbidden if token payload is not backoffice token", async () => {
    await expectPromiseToFailWith(
      updateIcUserRoleForAgency.execute(
        { role: "counsellor", agencyId: "agency-1", userId: "john-123" },
        {
          role: "validator",
        } as any,
      ),
      "This user is not a backOffice user, role was : 'validator'",
    );
  });

  it("throws not found if user does not exist", async () => {
    await expectPromiseToFailWith(
      updateIcUserRoleForAgency.execute(
        {
          role: "counsellor",
          agencyId: "agency-1",
          userId: "john-123",
        },
        { role: "backOffice" } as BackOfficeJwtPayload,
      ),
      "User with id john-123 not found",
    );
  });

  it("throws not found if agency does not exist for user", async () => {
    inclusionConnectedUserRepository.setInclusionConnectedUsers([
      { ...user, agencyRights: [] },
    ]);

    await expectPromiseToFailWith(
      updateIcUserRoleForAgency.execute(
        {
          role: "counsellor",
          agencyId: "agency-1",
          userId: "john-123",
        },
        { role: "backOffice" } as BackOfficeJwtPayload,
      ),
      "Agency with id agency-1 is not registered for user with id john-123",
    );
  });

  it("changes the role of a user for a given agency", async () => {
    const agency = new AgencyDtoBuilder().build();
    const icUser: InclusionConnectedUser = {
      ...user,
      agencyRights: [{ agency, role: "toReview" }],
    };

    inclusionConnectedUserRepository.setInclusionConnectedUsers([icUser]);
    const newRole: AgencyRole = "validator";

    await updateIcUserRoleForAgency.execute(
      {
        role: newRole,
        agencyId: agency.id,
        userId: user.id,
      },
      { role: "backOffice" } as BackOfficeJwtPayload,
    );

    expectToEqual(await inclusionConnectedUserRepository.getById(user.id), {
      ...user,
      agencyRights: [{ agency, role: newRole }],
    });
  });
});
