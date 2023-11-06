import {
  AgencyDtoBuilder,
  AuthenticatedUser,
  BackOfficeJwtPayload,
  expectPromiseToFailWith,
  expectToEqual,
  InclusionConnectedUser,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { RejectIcUserForAgency } from "./RejectIcUserForAgency";

const user: AuthenticatedUser = {
  id: "john-123",
  email: "john@mail.com",
  firstName: "John",
  lastName: "Lennon",
};

describe("reject IcUser for agency", () => {
  let uow: InMemoryUnitOfWork;
  let rejectIcUserForAgencyUsecase: RejectIcUserForAgency;
  let uuidGenerator: TestUuidGenerator;
  let timeGateway: CustomTimeGateway;
  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({ timeGateway, uuidGenerator });
    const uowPerformer = new InMemoryUowPerformer(uow);
    rejectIcUserForAgencyUsecase = new RejectIcUserForAgency(
      uowPerformer,
      createNewEvent,
    );
  });

  it("Throw when no icUser were found", async () => {
    const agency1 = new AgencyDtoBuilder().withId("agency1").build();

    const icUser: InclusionConnectedUser = {
      ...user,
      agencyRights: [{ agency: agency1, role: "toReview" }],
    };

    await expectPromiseToFailWith(
      rejectIcUserForAgencyUsecase.execute(
        {
          userId: icUser.id,
          agencyId: agency1.id,
          justification: "osef",
        },
        { role: "backOffice" } as BackOfficeJwtPayload,
      ),
      `No user found with id: ${icUser.id}`,
    );
  });

  it("Throw when no agency were found", async () => {
    const agency1 = new AgencyDtoBuilder().withId("agency1").build();

    const icUser: InclusionConnectedUser = {
      ...user,
      agencyRights: [{ agency: agency1, role: "toReview" }],
    };

    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([icUser]);

    await expectPromiseToFailWith(
      rejectIcUserForAgencyUsecase.execute(
        {
          userId: icUser.id,
          agencyId: agency1.id,
          justification: "osef",
        },
        { role: "backOffice" } as BackOfficeJwtPayload,
      ),
      `No agency found with id: ${agency1.id}`,
    );
  });

  it("throws when no jwt token provided", async () => {
    const agency1 = new AgencyDtoBuilder().withId("agency1").build();

    const icUser: InclusionConnectedUser = {
      ...user,
      agencyRights: [{ agency: agency1, role: "toReview" }],
    };

    await expectPromiseToFailWith(
      rejectIcUserForAgencyUsecase.execute({
        userId: icUser.id,
        agencyId: agency1.id,
        justification: "osef",
      }),
      "No JWT token provided",
    );
  });

  it("Throw when wrong jwt were provided", async () => {
    const agency1 = new AgencyDtoBuilder().withId("agency1").build();

    const icUser: InclusionConnectedUser = {
      ...user,
      agencyRights: [{ agency: agency1, role: "toReview" }],
    };

    await expectPromiseToFailWith(
      rejectIcUserForAgencyUsecase.execute(
        {
          userId: icUser.id,
          agencyId: agency1.id,
          justification: "osef",
        },
        {
          role: "validator",
        } as any,
      ),
      "This user is not a backOffice user, role was : 'validator'",
    );
  });

  it("Remove agency right for IcUser", async () => {
    const now = new Date("2023-11-07");
    timeGateway.setNextDate(now);
    const agency1 = new AgencyDtoBuilder().withId("agency1").build();
    const agency2 = new AgencyDtoBuilder().withId("agency2").build();

    const icUser: InclusionConnectedUser = {
      ...user,
      agencyRights: [
        { agency: agency1, role: "toReview" },
        { agency: agency2, role: "toReview" },
      ],
    };

    uow.agencyRepository.setAgencies([agency1, agency2]);

    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([icUser]);

    await rejectIcUserForAgencyUsecase.execute(
      {
        userId: icUser.id,
        agencyId: agency1.id,
        justification: "osef",
      },
      { role: "backOffice" } as BackOfficeJwtPayload,
    );

    expectToEqual(uow.inclusionConnectedUserRepository.agencyRightsByUserId, {
      [icUser.id]: [{ agency: agency2, role: "toReview" }],
    });

    expectToEqual(uow.outboxRepository.events, [
      {
        id: uuidGenerator.new(),
        occurredAt: now.toISOString(),
        topic: "IcUserAgencyRightRejected",
        payload: {
          userId: icUser.id,
          agencyId: agency1.id,
          justification: "osef",
        },
        publications: [],
        status: "never-published",
        wasQuarantined: false,
      },
    ]);
  });
});
