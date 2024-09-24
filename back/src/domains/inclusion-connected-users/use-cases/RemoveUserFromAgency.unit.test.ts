import {
  AgencyDto,
  AgencyDtoBuilder,
  AgencyRight,
  InclusionConnectedUser,
  InclusionConnectedUserBuilder,
  RemoveAgencyUserParams,
  errors,
  expectPromiseToFailWithError,
} from "shared";
import { InMemoryAgencyRepository } from "../../agency/adapters/InMemoryAgencyRepository";
import { InMemoryUserRepository } from "../../core/authentication/inclusion-connect/adapters/InMemoryUserRepository";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import {
  RemoveUserFromAgency,
  makeRemoveUserFromAgency,
} from "./RemoveUserFromAgency";

const agency = new AgencyDtoBuilder()
  .withCounsellorEmails(["fake-email@gmail.com"])
  .build();

const backofficeAdminUser = new InclusionConnectedUserBuilder()
  .withId("backoffice-admin-id")
  .withIsAdmin(true)
  .build();

const notAdminUser = new InclusionConnectedUserBuilder()
  .withId("not-admin-id")
  .withIsAdmin(false)
  .build();

describe("RemoveUserFromAgency", () => {
  let timeGateway: TimeGateway;
  let uuidGenerator: UuidGenerator;
  let createNewEvent: CreateNewEvent;
  let removeUserFromAgency: RemoveUserFromAgency;
  let userRepository: InMemoryUserRepository;
  let agencyRepository: InMemoryAgencyRepository;

  beforeEach(() => {
    const uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({
      uuidGenerator,
      timeGateway,
    });
    userRepository = uow.userRepository;
    agencyRepository = uow.agencyRepository;
    userRepository.setInclusionConnectedUsers([
      backofficeAdminUser,
      notAdminUser,
    ]);
    agencyRepository.setAgencies([agency]);
    removeUserFromAgency = makeRemoveUserFromAgency({
      uowPerformer,
      deps: { createNewEvent },
    });
  });

  it("throws forbidden when token payload is not backoffice token", () => {
    expectPromiseToFailWithError(
      removeUserFromAgency.execute(
        {
          agencyId: "agency-id",
          userId: "user-id",
        },
        notAdminUser,
      ),
      errors.user.forbidden({ userId: notAdminUser.id }),
    );
  });

  it("throws notFound if user to delete not found", async () => {
    const inputParams: RemoveAgencyUserParams = {
      agencyId: agency.id,
      userId: "unexisting-user",
    };

    expectPromiseToFailWithError(
      removeUserFromAgency.execute(inputParams, backofficeAdminUser),
      errors.user.notFound({ userId: inputParams.userId }),
    );
  });

  it("throws forbidden if user to delete has not rights on agency", async () => {
    const inputParams: RemoveAgencyUserParams = {
      agencyId: agency.id,
      userId: notAdminUser.id,
    };

    expectPromiseToFailWithError(
      removeUserFromAgency.execute(inputParams, backofficeAdminUser),
      errors.user.expectedRightsOnAgency(inputParams),
    );
  });

  it("throws forbidden if user to delete is the last validator receiving notifications", async () => {
    const initialAgencyRights: AgencyRight[] = [
      {
        agency,
        roles: ["validator"],
        isNotifiedByEmail: true,
      },
    ];
    const user: InclusionConnectedUser = {
      ...notAdminUser,
      agencyRights: initialAgencyRights,
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };
    userRepository.setInclusionConnectedUsers([user]);
    const inputParams: RemoveAgencyUserParams = {
      agencyId: agency.id,
      userId: notAdminUser.id,
    };

    expectPromiseToFailWithError(
      removeUserFromAgency.execute(inputParams, backofficeAdminUser),
      errors.agency.notEnoughValidators(inputParams),
    );
  });

  it("throws forbidden if user to delete is the last validator receiving notifications", async () => {
    const initialAgencyRights: AgencyRight[] = [
      {
        agency,
        roles: ["validator"],
        isNotifiedByEmail: true,
      },
    ];
    const user: InclusionConnectedUser = {
      ...notAdminUser,
      agencyRights: initialAgencyRights,
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };
    userRepository.setInclusionConnectedUsers([user]);
    const inputParams: RemoveAgencyUserParams = {
      agencyId: agency.id,
      userId: notAdminUser.id,
    };

    expectPromiseToFailWithError(
      removeUserFromAgency.execute(inputParams, backofficeAdminUser),
      errors.agency.notEnoughValidators(inputParams),
    );
  });

  it("throws forbidden if user to delete is the last counsellor receiving notifications", async () => {
    const agencyWithRefersTo: AgencyDto = {
      ...agency,
      id: "agency-with-refers-to-id",
      counsellorEmails: [],
      validatorEmails: [],
      refersToAgencyId: agency.id,
    };
    const initialAgencyRights: AgencyRight[] = [
      {
        agency: agencyWithRefersTo,
        roles: ["validator"],
        isNotifiedByEmail: true,
      },
    ];
    const user: InclusionConnectedUser = {
      ...notAdminUser,
      agencyRights: initialAgencyRights,
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };
    userRepository.setInclusionConnectedUsers([user]);
    const inputParams: RemoveAgencyUserParams = {
      agencyId: agencyWithRefersTo.id,
      userId: notAdminUser.id,
    };

    expectPromiseToFailWithError(
      removeUserFromAgency.execute(inputParams, backofficeAdminUser),
      errors.agency.notEnoughCounsellors(inputParams),
    );
  });

  describe("user to delete has right on agency", () => {
    it("remove user from agency", async () => {
      const agency2 = new AgencyDtoBuilder().withId("agency-2-id").build();
      const initialAgencyRights: AgencyRight[] = [
        {
          agency,
          roles: ["validator"],
          isNotifiedByEmail: true,
        },
        {
          agency: agency2,
          roles: ["validator"],
          isNotifiedByEmail: true,
        },
      ];
      const user: InclusionConnectedUser = {
        ...notAdminUser,
        agencyRights: initialAgencyRights,
        dashboards: {
          agencies: {},
          establishments: {},
        },
      };
      const otherUserWithRightOnAgencies: InclusionConnectedUser = {
        ...notAdminUser,
        id: "other-user-id",
        agencyRights: initialAgencyRights,
        dashboards: {
          agencies: {},
          establishments: {},
        },
      };
      userRepository.setInclusionConnectedUsers([
        user,
        otherUserWithRightOnAgencies,
      ]);
      expect(
        (await userRepository.getById(notAdminUser.id))?.agencyRights,
      ).toEqual(initialAgencyRights);

      const inputParams: RemoveAgencyUserParams = {
        agencyId: agency.id,
        userId: notAdminUser.id,
      };
      await removeUserFromAgency.execute(inputParams, backofficeAdminUser);

      expect(
        (await userRepository.getById(inputParams.userId))?.agencyRights,
      ).toEqual([
        {
          agency: agency2,
          roles: ["validator"],
          isNotifiedByEmail: true,
        },
      ]);
    });
  });
});
