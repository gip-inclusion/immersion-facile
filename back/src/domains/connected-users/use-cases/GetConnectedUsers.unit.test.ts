import {
  AgencyDtoBuilder,
  ConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  toAgencyDtoForAgencyUsersAndAdmins,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { fakeProConnectSiret } from "../../core/authentication/connected-user/adapters/oauth-gateway/InMemoryOAuthGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { GetConnectedUsers } from "./GetConnectedUsers";

describe("GetConnectedUsers", () => {
  const johnBuilder = new ConnectedUserBuilder()
    .withId("john-123")
    .withFirstName("John")
    .withLastName("Lennon")
    .withEmail("john@mail.com")
    .withCreatedAt(new Date())
    .withProConnectInfos({
      externalId: "john-external-id",
      siret: fakeProConnectSiret,
    });

  const johnUser = johnBuilder.buildUser();
  const connectedJohnUser = johnBuilder.build();

  const paulBuilder = new ConnectedUserBuilder()
    .withId("paul-456")
    .withFirstName("Paul")
    .withLastName("McCartney")
    .withEmail("paul@mail.com")
    .withCreatedAt(new Date())
    .withProConnectInfos({
      externalId: "paul-external-id",
      siret: fakeProConnectSiret,
    });

  const paulUser = paulBuilder.buildUser();
  const connectedPaulUser = paulBuilder.build();

  const backOfficeUserBuilder = new ConnectedUserBuilder()
    .withId("backoffice-admin")
    .withFirstName("Jack")
    .withLastName("The Admin")
    .withEmail("jack.admin@mail.com")
    .withCreatedAt(new Date())
    .withProConnectInfos({
      externalId: "jack-admin-external-id",
      siret: fakeProConnectSiret,
    })
    .withIsAdmin(true);

  const backOfficeUser = backOfficeUserBuilder.buildUser();
  const connectedBackOffice = backOfficeUserBuilder.build();

  const notBackOfficeUserBuilder = new ConnectedUserBuilder(connectedBackOffice)
    .withProConnectInfos({
      externalId: "not-backoffice-admin",
      siret: fakeProConnectSiret,
    })
    .withIsAdmin(false);
  const notBackOfficeUser = notBackOfficeUserBuilder.buildUser();
  const connectedNotBackOffice = notBackOfficeUserBuilder.build();

  const agency1 = new AgencyDtoBuilder().withId("agency-1").build();
  const agency2 = new AgencyDtoBuilder().withId("agency-2").build();
  const agencyWithRefersTo = new AgencyDtoBuilder()
    .withId("agency-with-refers-to")
    .withRefersToAgencyInfo({
      refersToAgencyId: agency2.id,
      refersToAgencyName: agency2.name,
    })
    .build();
  const agencyAdminUserBuilder = new ConnectedUserBuilder()
    .withId("agency-admin")
    .withFirstName("Jack")
    .withLastName("The agency Admin")
    .withEmail("jack.admin@mail.com")
    .withCreatedAt(new Date())
    .withProConnectInfos({
      externalId: "jack-admin-external-id",
      siret: fakeProConnectSiret,
    })
    .withAgencyRights([
      {
        agency: toAgencyDtoForAgencyUsersAndAdmins(agencyWithRefersTo, []),
        roles: ["agency-admin"],
        isNotifiedByEmail: true,
      },
    ]);

  const agencyAdminUser = agencyAdminUserBuilder.buildUser();
  const agencyAdmin = agencyAdminUserBuilder.build();

  const agency1WithRights = toAgencyWithRights(agency1, {
    [johnUser.id]: {
      roles: ["to-review"],
      isNotifiedByEmail: true,
    },
    [paulUser.id]: {
      roles: ["counsellor"],
      isNotifiedByEmail: true,
    },
  });

  const agency2WithRights = toAgencyWithRights(agency2, {
    [johnUser.id]: {
      roles: ["validator"],
      isNotifiedByEmail: true,
    },
    [paulUser.id]: {
      roles: ["validator"],
      isNotifiedByEmail: true,
    },
  });

  const agencyWithRefersToWithRights = toAgencyWithRights(agencyWithRefersTo, {
    [agencyAdminUser.id]: {
      roles: ["agency-admin"],
      isNotifiedByEmail: true,
    },
  });

  let getConnectedUsers: GetConnectedUsers;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    getConnectedUsers = new GetConnectedUsers(new InMemoryUowPerformer(uow));
  });

  it("throws Unauthorized if no jwt token provided", async () => {
    await expectPromiseToFailWithError(
      getConnectedUsers.execute({ agencyRole: "to-review" }),
      errors.user.unauthorized(),
    );
  });

  it("throws Forbidden if token payload is not backoffice token", async () => {
    uow.userRepository.users = [notBackOfficeUser];

    await expectPromiseToFailWithError(
      getConnectedUsers.execute(
        { agencyRole: "to-review" },
        connectedNotBackOffice,
      ),
      errors.user.forbidden({ userId: notBackOfficeUser.id }),
    );
  });

  it("throws Forbidden if filter has agency id and token payload is not backoffice token neither agency Admin ", async () => {
    uow.userRepository.users = [connectedPaulUser];

    await expectPromiseToFailWithError(
      getConnectedUsers.execute({ agencyId: agency2.id }, connectedPaulUser),
      errors.user.forbidden({ userId: connectedPaulUser.id }),
    );
  });

  it("gets the users by agencyRole which have at least one agency with the given role", async () => {
    uow.userRepository.users = [johnUser, paulUser, backOfficeUser];
    uow.agencyRepository.agencies = [agency1WithRights, agency2WithRights];

    const users = await getConnectedUsers.execute(
      { agencyRole: "to-review" },
      connectedBackOffice,
    );

    expectToEqual(users, [
      {
        ...connectedJohnUser,
        agencyRights: [
          {
            agency: toAgencyDtoForAgencyUsersAndAdmins(agency1, []),
            isNotifiedByEmail: true,
            roles: ["to-review"],
          },
          {
            agency: toAgencyDtoForAgencyUsersAndAdmins(agency2, []),
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
        ],
      },
    ]);
  });

  it("gets the users by agencyId which have at least one agency with the given role", async () => {
    uow.userRepository.users = [johnUser, paulUser, backOfficeUser];
    uow.agencyRepository.agencies = [agency1WithRights, agency2WithRights];

    const users = await getConnectedUsers.execute(
      { agencyId: agency1.id },
      connectedBackOffice,
    );

    expectToEqual(users, [
      {
        ...connectedJohnUser,
        agencyRights: [
          {
            agency: toAgencyDtoForAgencyUsersAndAdmins(agency1, []),
            isNotifiedByEmail: true,
            roles: ["to-review"],
          },
          {
            agency: toAgencyDtoForAgencyUsersAndAdmins(agency2, []),
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
        ],
      },
      {
        ...connectedPaulUser,
        agencyRights: [
          {
            agency: toAgencyDtoForAgencyUsersAndAdmins(agency1, []),
            isNotifiedByEmail: true,
            roles: ["counsellor"],
          },
          {
            agency: toAgencyDtoForAgencyUsersAndAdmins(agency2, []),
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
        ],
      },
    ]);
  });

  it("gets the users by agencyId when agency admin request it", async () => {
    uow.userRepository.users = [
      johnUser,
      paulUser,
      backOfficeUser,
      agencyAdminUser,
    ];
    uow.agencyRepository.agencies = [
      agency1WithRights,
      agency2WithRights,
      agencyWithRefersToWithRights,
    ];

    const users = await getConnectedUsers.execute(
      { agencyId: agencyWithRefersToWithRights.id },
      agencyAdmin,
    );

    expectToEqual(users, [
      {
        ...agencyAdmin,
        agencyRights: [
          {
            agency: toAgencyDtoForAgencyUsersAndAdmins(agencyWithRefersTo, [
              agencyAdminUser.email,
            ]),
            isNotifiedByEmail: true,
            roles: ["agency-admin"],
          },
        ],
      },
    ]);
  });

  it("returns results ordered Alphabetically, people with no name should be first", async () => {
    const genericUserBuilder = new ConnectedUserBuilder()
      .withId("generic-222")
      .withFirstName("")
      .withLastName("")
      .withEmail("generic@mail.com")
      .withCreatedAt(new Date());

    const genericUser = genericUserBuilder.buildUser();
    const connectedGenericUser = genericUserBuilder.build();

    const agency1WithRights = toAgencyWithRights(agency1, {
      [johnUser.id]: {
        roles: ["to-review"],
        isNotifiedByEmail: true,
      },
      [paulUser.id]: {
        roles: ["counsellor"],
        isNotifiedByEmail: true,
      },
      [genericUser.id]: {
        roles: ["counsellor"],
        isNotifiedByEmail: true,
      },
    });

    const agency2WithRights = toAgencyWithRights(agency2, {
      [johnUser.id]: {
        roles: ["validator"],
        isNotifiedByEmail: true,
      },
      [paulUser.id]: {
        roles: ["validator"],
        isNotifiedByEmail: true,
      },
      [genericUser.id]: {
        roles: ["validator"],
        isNotifiedByEmail: true,
      },
    });

    uow.userRepository.users = [
      johnUser,
      paulUser,
      backOfficeUser,
      genericUser,
    ];
    uow.agencyRepository.agencies = [agency1WithRights, agency2WithRights];

    const users = await getConnectedUsers.execute(
      { agencyId: agency1.id },
      connectedBackOffice,
    );

    expectToEqual(users, [
      {
        ...connectedGenericUser,
        agencyRights: [
          {
            agency: toAgencyDtoForAgencyUsersAndAdmins(agency1, []),
            isNotifiedByEmail: true,
            roles: ["counsellor"],
          },
          {
            agency: toAgencyDtoForAgencyUsersAndAdmins(agency2, []),
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
        ],
      },
      {
        ...connectedJohnUser,
        agencyRights: [
          {
            agency: toAgencyDtoForAgencyUsersAndAdmins(agency1, []),
            isNotifiedByEmail: true,
            roles: ["to-review"],
          },
          {
            agency: toAgencyDtoForAgencyUsersAndAdmins(agency2, []),
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
        ],
      },
      {
        ...connectedPaulUser,
        agencyRights: [
          {
            agency: toAgencyDtoForAgencyUsersAndAdmins(agency1, []),
            isNotifiedByEmail: true,
            roles: ["counsellor"],
          },
          {
            agency: toAgencyDtoForAgencyUsersAndAdmins(agency2, []),
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
        ],
      },
    ]);
  });
});
