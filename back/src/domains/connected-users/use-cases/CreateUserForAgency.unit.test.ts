import {
  AgencyDtoBuilder,
  ConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  toAgencyDtoForAgencyUsersAndAdmins,
  type User,
  type UserParamsForAgency,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { fakeProConnectSiret } from "../../core/authentication/connected-user/adapters/oauth-gateway/InMemoryOAuthGateway";
import { emptyName } from "../../core/authentication/connected-user/entities/user.helper";
import { StubDashboardGateway } from "../../core/dashboard/adapters/StubDashboardGateway";
import {
  type CreateNewEvent,
  makeCreateNewEvent,
} from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import type { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import {
  type CreateUserForAgency,
  makeCreateUserForAgency,
} from "./CreateUserForAgency";

describe("CreateUserForAgency", () => {
  const counsellor = new ConnectedUserBuilder()
    .withId("counsellor")
    .withEmail("counsellor@mail.com")
    .buildUser();

  const agencyWithCounsellor = new AgencyDtoBuilder().build();

  const backofficeAdminUserBuilder = new ConnectedUserBuilder()
    .withId("backoffice-admin-id")
    .withIsAdmin(true);
  const connectedBackofficeAdminUser = backofficeAdminUserBuilder.build();
  const backofficeAdminUser = backofficeAdminUserBuilder.buildUser();

  const notAdminUserBuilder = new ConnectedUserBuilder()
    .withId("not-admin-id")
    .withIsAdmin(false);
  const connectedNotAdminUser = notAdminUserBuilder.build();
  const notAdminUser = notAdminUserBuilder.buildUser();

  const notAgencyAdminUserBuilder = new ConnectedUserBuilder()
    .withId("not-agency-admin-id")
    .withIsAdmin(false);
  const connectedNotAgencyAdminUser = notAgencyAdminUserBuilder.build();

  const agencyAdminUserBuilder = new ConnectedUserBuilder()
    .withId("agency-admin-id")
    .withIsAdmin(false)
    .withAgencyRights([
      {
        agency: toAgencyDtoForAgencyUsersAndAdmins(agencyWithCounsellor, []),
        roles: ["agency-admin"],
        isNotifiedByEmail: true,
      },
    ]);
  const connectedAgencyAdminUser = agencyAdminUserBuilder.build();

  let uow: InMemoryUnitOfWork;
  let createUserForAgency: CreateUserForAgency;
  let timeGateway: TimeGateway;
  let uuidGenerator: UuidGenerator;
  let createNewEvent: CreateNewEvent;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({
      uuidGenerator,
      timeGateway,
    });
    createUserForAgency = makeCreateUserForAgency({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        timeGateway,
        createNewEvent,
        dashboardGateway: new StubDashboardGateway(),
      },
    });

    uow.agencyRepository.agencies = [
      toAgencyWithRights(agencyWithCounsellor, {
        [counsellor.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
      }),
    ];
    uow.userRepository.users = [connectedBackofficeAdminUser, notAdminUser];
  });

  it("throws Forbidden if token payload is not backoffice token", async () => {
    await expectPromiseToFailWithError(
      createUserForAgency.execute(
        {
          userId: uuidGenerator.new(),
          roles: ["counsellor"],
          agencyId: "agency-1",
          isNotifiedByEmail: true,
          email: "any@email.fr",
        },
        connectedNotAdminUser,
      ),
      errors.user.forbidden({ userId: connectedNotAdminUser.id }),
    );
  });

  it("throws Forbidden if token payload is not admin on agency", async () => {
    await expectPromiseToFailWithError(
      createUserForAgency.execute(
        {
          userId: uuidGenerator.new(),
          roles: ["counsellor"],
          agencyId: "agency-1",
          isNotifiedByEmail: true,
          email: "any@email.fr",
        },
        connectedNotAgencyAdminUser,
      ),
      errors.user.forbidden({ userId: connectedNotAgencyAdminUser.id }),
    );
  });

  it("throws not found if agency does not exist", async () => {
    uow.userRepository.users = [backofficeAdminUser, connectedNotAdminUser];

    const agencyId = "Fake-Agency-Id";

    await expectPromiseToFailWithError(
      createUserForAgency.execute(
        {
          userId: uuidGenerator.new(),
          roles: ["counsellor"],
          agencyId,
          isNotifiedByEmail: true,
          email: "notAdminUser@email.fr",
        },
        connectedBackofficeAdminUser,
      ),
      errors.agency.notFound({
        agencyId,
      }),
    );
  });

  describe("Agency with refers to agency", () => {
    const agencyWithRefersTo = new AgencyDtoBuilder()
      .withId("agency-with-refers-to")
      .withRefersToAgencyInfo({
        refersToAgencyId: agencyWithCounsellor.id,
        refersToAgencyName: agencyWithCounsellor.name,
      })
      .build();

    it("Throw when user have role validator", async () => {
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agencyWithRefersTo, {
          [counsellor.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
        }),
        toAgencyWithRights(agencyWithCounsellor, {
          [counsellor.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
        }),
      ];

      expectPromiseToFailWithError(
        createUserForAgency.execute(
          {
            userId: uuidGenerator.new(),
            agencyId: agencyWithRefersTo.id,
            roles: ["validator"],
            isNotifiedByEmail: true,
            email: "new-user@email.fr",
          },
          connectedBackofficeAdminUser,
        ),
        errors.agency.invalidRoleUpdateForAgencyWithRefersTo({
          agencyId: agencyWithRefersTo.id,
          role: "validator",
        }),
      );
    });
  });

  it.each([
    {
      triggeredByRole: "backoffice-admin",
      triggeredByUser: connectedBackofficeAdminUser,
    },
    {
      triggeredByRole: "agency-admin",
      triggeredByUser: connectedAgencyAdminUser,
    },
  ])(
    "$triggeredByRole can create new user with its agency rights if no other users exist by email",
    async ({ triggeredByUser }) => {
      const newUserId = uuidGenerator.new();
      uow.userRepository.users = [counsellor];

      const userForAgency: UserParamsForAgency = {
        userId: newUserId,
        agencyId: agencyWithCounsellor.id,
        roles: ["counsellor"],
        isNotifiedByEmail: false,
        email: "new-user@email.fr",
      };

      //TODO: ici un usecase de commande qui retourne de la data et en prime, le retour attendu n'est pas testé
      await createUserForAgency.execute(userForAgency, triggeredByUser);

      expectToEqual(uow.userRepository.users, [
        counsellor,
        {
          id: userForAgency.userId,
          email: userForAgency.email,
          createdAt: timeGateway.now().toISOString(),
          firstName: emptyName,
          lastName: emptyName,
          proConnect: null,
        },
      ]);
      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights(agencyWithCounsellor, {
          [newUserId]: { isNotifiedByEmail: false, roles: ["counsellor"] },
          [counsellor.id]: {
            isNotifiedByEmail: false,
            roles: ["counsellor"],
          },
        }),
      ]);

      expectToEqual(uow.outboxRepository.events, [
        createNewEvent({
          topic: "ConnectedUserAgencyRightChanged",
          payload: {
            agencyId: userForAgency.agencyId,
            userId: userForAgency.userId,
            triggeredBy: {
              kind: "connected-user",
              userId: triggeredByUser.id,
            },
          },
        }),
      ]);
    },
  );

  it.each([
    {
      triggeredByRole: "backoffice-admin",
      triggeredByUser: connectedBackofficeAdminUser,
    },
    {
      triggeredByRole: "agency-admin",
      triggeredByUser: connectedAgencyAdminUser,
    },
  ])(
    "$triggeredByRole can add agency rights to an existing user",
    async ({ triggeredByUser }) => {
      const validator: User = {
        id: "validator",
        email: "user@email.fr",
        firstName: "John",
        lastName: "Doe",
        proConnect: {
          externalId: "osef",
          siret: fakeProConnectSiret,
        },
        createdAt: timeGateway.now().toISOString(),
      };
      uow.userRepository.users = [
        validator,
        counsellor,
        connectedAgencyAdminUser,
      ];

      const anotherAgency = new AgencyDtoBuilder()
        .withId("another-agency-id")
        .build();
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agencyWithCounsellor, {
          [connectedAgencyAdminUser.id]: {
            isNotifiedByEmail: false,
            roles: ["agency-admin"],
          },
        }),
        toAgencyWithRights(anotherAgency, {
          [counsellor.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      ];

      const userForAgency: UserParamsForAgency = {
        userId: validator.id,
        agencyId: agencyWithCounsellor.id,
        roles: ["counsellor"],
        isNotifiedByEmail: false,
        email: validator.email,
      };

      await createUserForAgency.execute(userForAgency, triggeredByUser);

      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights(agencyWithCounsellor, {
          [connectedAgencyAdminUser.id]: {
            isNotifiedByEmail: false,
            roles: ["agency-admin"],
          },
          [validator.id]: {
            isNotifiedByEmail: userForAgency.isNotifiedByEmail,
            roles: userForAgency.roles,
          },
        }),
        toAgencyWithRights(anotherAgency, {
          [counsellor.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      ]);
      expectToEqual(uow.outboxRepository.events, [
        createNewEvent({
          topic: "ConnectedUserAgencyRightChanged",
          payload: {
            agencyId: agencyWithCounsellor.id,
            userId: validator.id,
            triggeredBy: {
              kind: "connected-user",
              userId: triggeredByUser.id,
            },
          },
        }),
      ]);
    },
  );

  it("throw if user already exist in agency", async () => {
    const validator: User = {
      id: "validator",
      email: "user@email.fr",
      firstName: "John",
      lastName: "Doe",
      createdAt: timeGateway.now().toISOString(),
      proConnect: null,
    };
    uow.userRepository.users = [validator, counsellor];

    uow.agencyRepository.agencies = [
      toAgencyWithRights(agencyWithCounsellor, {
        [counsellor.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
        [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    ];

    const connectedUserForAgency: UserParamsForAgency = {
      userId: validator.id,
      agencyId: agencyWithCounsellor.id,
      roles: ["counsellor"],
      isNotifiedByEmail: false,
      email: validator.email,
    };

    await expectPromiseToFailWithError(
      createUserForAgency.execute(
        connectedUserForAgency,
        connectedBackofficeAdminUser,
      ),
      errors.agency.userAlreadyExist(),
    );
  });
});
