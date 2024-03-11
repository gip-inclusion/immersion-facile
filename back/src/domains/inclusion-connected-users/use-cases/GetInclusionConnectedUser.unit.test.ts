import {
  AgencyDtoBuilder,
  AuthenticatedUser,
  ConventionDtoBuilder,
  InclusionConnectJwtPayload,
  InclusionConnectedUser,
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
import { DiscussionBuilder } from "../../establishment/adapters/InMemoryDiscussionRepository";
import { GetInclusionConnectedUser } from "./GetInclusionConnectedUser";

describe("GetUserAgencyDashboardUrl", () => {
  const userId = "123";
  const inclusionConnectJwtPayload: InclusionConnectJwtPayload = {
    exp: 0,
    iat: 0,
    version: 1,
    userId,
  };
  const john: AuthenticatedUser = {
    id: userId,
    email: "john@mail.com",
    firstName: "John",
    lastName: "Doe",
    externalId: "john-external-id",
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
          establishmentDashboards: {},
        },
      ]);
      const url = await getInclusionConnectedUser.execute(
        undefined,
        inclusionConnectJwtPayload,
      );

      expectToEqual(url, {
        ...john,
        agencyRights: [{ agency, role: agencyUserRole }],
        agencyDashboardUrl: `http://stubAgencyDashboard/${agency.id}`,
        establishmentDashboards: {},
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
        establishmentDashboards: {},
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
        establishmentDashboards: {},
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
      establishmentDashboards: {},
      // dashboardUrl is coming from StubDashboardGateway
      agencyDashboardUrl: `http://stubAgencyDashboard/${agency1.id}_${agency2.id}_${agency4.id}`,
      erroredConventionsDashboardUrl: `http://stubErroredConventionDashboard/${agency1.id}_${agency2.id}_${agency4.id}`,
    });
  });

  it("doesn't return errored convention dashboard url when user has no agency of kind PE", async () => {
    const agencyBuilder = new AgencyDtoBuilder();
    const agency1 = agencyBuilder.withId("1111").withKind("cci").build();

    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
      {
        ...john,
        agencyRights: [{ agency: agency1, role: "counsellor" }],
        establishmentDashboards: {},
      },
    ]);
    const url = await getInclusionConnectedUser.execute(
      undefined,
      inclusionConnectJwtPayload,
    );

    expect(url.erroredConventionsDashboardUrl).toBeUndefined();

    expectToEqual(url, {
      ...john,
      agencyRights: [{ agency: agency1, role: "counsellor" }],
      establishmentDashboards: {},
      // dashboardUrl is coming from StubDashboardGateway
      agencyDashboardUrl: `http://stubAgencyDashboard/${agency1.id}`,
    });
  });

  describe("establishment dashboards", () => {
    describe("convention", () => {
      it("retrieve dashboard when IC user is establishement rep in at least one convention", async () => {
        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
          {
            ...john,
            establishmentDashboards: {},
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

        expectToEqual(result.establishmentDashboards, {
          conventions: {
            role: "establishment-representative",
            url: `http://stubEstablishmentConventionsDashboardUrl/${
              john.id
            }/${timeGateway.now()}`,
          },
        });
      });

      it("retrieve dashboard when IC user is establishement tutor in at least one convention", async () => {
        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
          {
            ...john,
            agencyRights: [],
            establishmentDashboards: {},
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

        expectToEqual(result.establishmentDashboards, {
          conventions: {
            role: "establishment-tutor",
            url: `http://stubEstablishmentConventionsDashboardUrl/${
              john.id
            }/${timeGateway.now()}`,
          },
        });
      });

      it("should retrieve dashboard when ic user is establishment representative and tutor for at least one convention", async () => {
        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
          {
            ...john,
            agencyRights: [],
            establishmentDashboards: {},
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

        expectToEqual(result.establishmentDashboards, {
          conventions: {
            url: `http://stubEstablishmentConventionsDashboardUrl/${
              john.id
            }/${timeGateway.now()}`,
            role: "establishment-representative",
          },
        });
      });

      it("do not retrieve dashboard when IC user is not establishement tutor or respresentative in any conventions", async () => {
        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
          {
            ...john,
            agencyRights: [],
            establishmentDashboards: {},
          },
        ]);

        const result = await getInclusionConnectedUser.execute(
          undefined,
          inclusionConnectJwtPayload,
        );

        expectToEqual(result.establishmentDashboards, {});
      });
    });

    describe("discussions", () => {
      it("retrieve dashboard when IC user is establishment contact for at least one discussion", async () => {
        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
          {
            ...john,
            establishmentDashboards: {},
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

        expectToEqual(result.establishmentDashboards, {
          discussions: `http://stubEstablishmentDiscussionsDashboardUrl/${
            john.id
          }/${timeGateway.now()}`,
        });
      });

      it("do not retrieve dashboard when IC user is not establishment contact in any discussion", async () => {
        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
          {
            ...john,
            agencyRights: [],
            establishmentDashboards: {},
          },
        ]);

        const result = await getInclusionConnectedUser.execute(
          undefined,
          inclusionConnectJwtPayload,
        );

        expectToEqual(result.establishmentDashboards, {});
      });
    });
  });
});
