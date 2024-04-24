import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  DiscussionBuilder,
  InclusionConnectJwtPayload,
  InclusionConnectedUser,
  User,
  allAgencyRoles,
  expectPromiseToFailWith,
  expectToEqual,
  splitCasesBetweenPassingAndFailing,
} from "shared";
import { StubDashboardGateway } from "../../core/dashboard/adapters/StubDashboardGateway";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
} from "../../establishment/helpers/EstablishmentBuilders";
import { GetInclusionConnectedUser } from "./GetInclusionConnectedUser";

describe("GetUserAgencyDashboardUrl", () => {
  const userId = "123";
  const inclusionConnectJwtPayload: InclusionConnectJwtPayload = {
    exp: 0,
    iat: 0,
    version: 1,
    userId,
  };
  const john: User = {
    id: userId,
    email: "john@mail.com",
    firstName: "John",
    lastName: "Doe",
    externalId: "john-external-id",
    createdAt: new Date().toISOString(),
  };

  let getInclusionConnectedUser: GetInclusionConnectedUser;
  let uowPerformer: InMemoryUowPerformer;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    uowPerformer = new InMemoryUowPerformer(uow);
    timeGateway = new CustomTimeGateway();
    getInclusionConnectedUser = new GetInclusionConnectedUser(
      uowPerformer,
      new StubDashboardGateway(),
      timeGateway,
    );
  });

  it("throws NotFoundError if the user is not found", async () => {
    await expectPromiseToFailWith(
      getInclusionConnectedUser.execute(undefined, inclusionConnectJwtPayload),
      `No user found with provided ID : ${userId}`,
    );
  });

  it("throws Forbidden if no jwt token provided", async () => {
    await expectPromiseToFailWith(
      getInclusionConnectedUser.execute(),
      "No JWT token provided",
    );
  });

  it("returns an admin user without dashboard urls", async () => {
    const adminUser: InclusionConnectedUser = {
      ...john,
      agencyRights: [],
      dashboards: {
        agencies: {},
        establishments: {},
      },
      isBackofficeAdmin: true,
    };
    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
      adminUser,
    ]);

    const result = await getInclusionConnectedUser.execute(undefined, {
      ...inclusionConnectJwtPayload,
      userId: adminUser.id,
    });

    expectToEqual(result, adminUser);
  });

  const [agencyRolesAllowedToGetDashboard, agencyRolesForbiddenToGetDashboard] =
    splitCasesBetweenPassingAndFailing(allAgencyRoles, [
      "agencyOwner",
      "validator",
      "counsellor",
    ]);

  it.each(agencyRolesAllowedToGetDashboard)(
    "returns the dashboard url when role is '%s'",
    async (agencyUserRole) => {
      const agency = new AgencyDtoBuilder().build();
      uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
        {
          ...john,
          agencyRights: [{ agency, role: agencyUserRole }],
          dashboards: {
            agencies: {},
            establishments: {},
          },
        },
      ]);
      const url = await getInclusionConnectedUser.execute(
        undefined,
        inclusionConnectJwtPayload,
      );

      expectToEqual(url, {
        ...john,
        agencyRights: [{ agency, role: agencyUserRole }],
        dashboards: {
          agencies: {
            agencyDashboardUrl: `http://stubAgencyUserDashboard/${
              john.id
            }/${timeGateway.now()}`,
          },
          establishments: {},
        },
      }); // coming from StubDashboardGateway
    },
  );

  it.each(agencyRolesForbiddenToGetDashboard)(
    "gets the user without dashboard url for role '%s'",
    async (agencyUserRole) => {
      const storedInclusionConnectedUser: InclusionConnectedUser = {
        ...john,
        agencyRights: [
          { agency: new AgencyDtoBuilder().build(), role: agencyUserRole },
        ],
        dashboards: { agencies: {}, establishments: {} },
      };
      uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
        storedInclusionConnectedUser,
      ]);
      const inclusionConnectedUser = await getInclusionConnectedUser.execute(
        undefined,
        inclusionConnectJwtPayload,
      );

      expectToEqual(inclusionConnectedUser, storedInclusionConnectedUser);
    },
  );

  it("the dashboard url should not include the agency ids where role is 'toReview'", async () => {
    const agencyBuilder = new AgencyDtoBuilder();
    const agency1 = agencyBuilder
      .withId("1111")
      .withKind("pole-emploi")
      .build();
    const agency2 = agencyBuilder.withId("2222").build();
    const agency3 = agencyBuilder.withId("3333").build();
    const agency4 = agencyBuilder.withId("4444").build();

    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
      {
        ...john,
        agencyRights: [
          { agency: agency1, role: "counsellor" },
          { agency: agency2, role: "validator" },
          { agency: agency3, role: "toReview" },
          { agency: agency4, role: "agencyOwner" },
        ],
        dashboards: { agencies: {}, establishments: {} },
      },
    ]);
    const url = await getInclusionConnectedUser.execute(
      undefined,
      inclusionConnectJwtPayload,
    );

    expectToEqual(url, {
      ...john,
      agencyRights: [
        { agency: agency1, role: "counsellor" },
        { agency: agency2, role: "validator" },
        { agency: agency3, role: "toReview" },
        { agency: agency4, role: "agencyOwner" },
      ],
      dashboards: {
        agencies: {
          agencyDashboardUrl: `http://stubAgencyUserDashboard/${
            john.id
          }/${timeGateway.now()}`,
          erroredConventionsDashboardUrl: `http://stubErroredConventionDashboard/${
            john.id
          }/${timeGateway.now()}`,
        },
        establishments: {},
      },
    });
  });

  it("doesn't return errored convention dashboard url when user has no agency of kind PE", async () => {
    const agencyBuilder = new AgencyDtoBuilder();
    const agency1 = agencyBuilder.withId("1111").withKind("cci").build();

    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
      {
        ...john,
        agencyRights: [{ agency: agency1, role: "counsellor" }],
        dashboards: { agencies: {}, establishments: {} },
      },
    ]);
    const url = await getInclusionConnectedUser.execute(
      undefined,
      inclusionConnectJwtPayload,
    );

    expect(
      url.dashboards.agencies.erroredConventionsDashboardUrl,
    ).toBeUndefined();

    expectToEqual(url, {
      ...john,
      agencyRights: [{ agency: agency1, role: "counsellor" }],
      dashboards: {
        agencies: {
          agencyDashboardUrl: `http://stubAgencyUserDashboard/${
            john.id
          }/${timeGateway.now()}`,
        },
        establishments: {},
      },
    });
  });

  describe("establishment dashboards", () => {
    describe("convention", () => {
      it("retrieve dashboard when IC user is establishement rep in at least one convention", async () => {
        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
          {
            ...john,
            dashboards: { agencies: {}, establishments: {} },
            agencyRights: [],
          },
        ]);
        const convention = new ConventionDtoBuilder()
          .withEstablishmentRepresentativeEmail(john.email)
          .build();
        uow.conventionRepository.setConventions([convention]);

        const result = await getInclusionConnectedUser.execute(
          undefined,
          inclusionConnectJwtPayload,
        );

        expectToEqual(result.dashboards, {
          agencies: {},
          establishments: {
            conventions: {
              url: `http://stubEstablishmentConventionsDashboardUrl/${
                john.id
              }/${timeGateway.now()}`,
              role: "establishment-representative",
            },
          },
        });
      });

      it("retrieve dashboard when IC user is establishement tutor in at least one convention", async () => {
        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
          {
            ...john,
            agencyRights: [],
            dashboards: { agencies: {}, establishments: {} },
          },
        ]);
        const convention = new ConventionDtoBuilder()
          .withEstablishmentTutorEmail(john.email)
          .build();
        uow.conventionRepository.setConventions([convention]);

        const result = await getInclusionConnectedUser.execute(
          undefined,
          inclusionConnectJwtPayload,
        );

        expectToEqual(result.dashboards, {
          agencies: {},
          establishments: {
            conventions: {
              role: "establishment-tutor",
              url: `http://stubEstablishmentConventionsDashboardUrl/${
                john.id
              }/${timeGateway.now()}`,
            },
          },
        });
      });

      it("should retrieve dashboard when ic user is establishment representative and tutor for at least one convention", async () => {
        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
          {
            ...john,
            agencyRights: [],
            dashboards: { agencies: {}, establishments: {} },
          },
        ]);
        const convention = new ConventionDtoBuilder()
          .withEstablishmentTutorEmail(john.email)
          .withEstablishmentRepresentativeEmail(john.email)
          .build();
        uow.conventionRepository.setConventions([convention]);

        const result = await getInclusionConnectedUser.execute(
          undefined,
          inclusionConnectJwtPayload,
        );

        expectToEqual(result.dashboards, {
          agencies: {},
          establishments: {
            conventions: {
              url: `http://stubEstablishmentConventionsDashboardUrl/${
                john.id
              }/${timeGateway.now()}`,
              role: "establishment-representative",
            },
          },
        });
      });

      it("do not retrieve dashboard when IC user is not establishement tutor or respresentative in any conventions", async () => {
        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
          {
            ...john,
            agencyRights: [],
            dashboards: { agencies: {}, establishments: {} },
          },
        ]);

        const result = await getInclusionConnectedUser.execute(
          undefined,
          inclusionConnectJwtPayload,
        );

        expectToEqual(result.dashboards, {
          agencies: {},
          establishments: {},
        });
      });
    });

    describe("discussions", () => {
      it("retrieve dashboard when IC user is establishment contact for at least one discussion", async () => {
        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
          {
            ...john,
            dashboards: { agencies: {}, establishments: {} },
            agencyRights: [],
          },
        ]);
        uow.discussionRepository.discussions = [
          new DiscussionBuilder()
            .withEstablishmentContact({
              email: john.email,
            })
            .build(),
        ];

        const result = await getInclusionConnectedUser.execute(
          undefined,
          inclusionConnectJwtPayload,
        );

        expectToEqual(result.dashboards, {
          agencies: {},
          establishments: {
            discussions: `http://stubEstablishmentDiscussionsDashboardUrl/${
              john.id
            }/${timeGateway.now()}`,
          },
        });
      });

      it("do not retrieve dashboard when IC user is not establishment contact in any discussion", async () => {
        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
          {
            ...john,
            agencyRights: [],
            dashboards: { agencies: {}, establishments: {} },
          },
        ]);

        const result = await getInclusionConnectedUser.execute(
          undefined,
          inclusionConnectJwtPayload,
        );

        expectToEqual(result.dashboards, {
          agencies: {},
          establishments: {},
        });
      });
    });

    describe("establishments", () => {
      it("retrieve establishments when IC user is establishement rep in at least one establishment", async () => {
        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
          {
            ...john,
            dashboards: { agencies: {}, establishments: {} },
            agencyRights: [],
          },
        ]);

        const fakeBusinessContact = new ContactEntityBuilder()
          .withEmail(john.email)
          .build();

        const establishmentAggregate1 = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("89114285300012")
          .withContact(fakeBusinessContact)
          .build();

        const establishmentAggregate2 = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("89114285300013")
          .withContact(fakeBusinessContact)
          .build();

        uow.establishmentAggregateRepository.establishmentAggregates = [
          establishmentAggregate1,
          establishmentAggregate2,
        ];

        const result = await getInclusionConnectedUser.execute(
          undefined,
          inclusionConnectJwtPayload,
        );

        expectToEqual(result.establishments, [
          {
            siret: establishmentAggregate1.establishment.siret,
            businessName: establishmentAggregate1.establishment.name,
          },
          {
            siret: establishmentAggregate2.establishment.siret,
            businessName: establishmentAggregate2.establishment.name,
          },
        ]);
      });

      it("do not retrieve  establishment  when IC user is not establishment representative in at least one establishment", async () => {
        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
          {
            ...john,
            agencyRights: [],
            dashboards: { agencies: {}, establishments: {} },
          },
        ]);
        const convention = new ConventionDtoBuilder()
          .withEstablishmentTutorEmail(john.email)
          .build();
        uow.conventionRepository.setConventions([convention]);

        const result = await getInclusionConnectedUser.execute(
          undefined,
          inclusionConnectJwtPayload,
        );

        expectToEqual(result.establishments, undefined);
      });
    });
  });
});
