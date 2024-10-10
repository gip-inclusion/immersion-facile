import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  DiscussionBuilder,
  InclusionConnectedUser,
  InclusionConnectedUserBuilder,
  allAgencyRoles,
  errors,
  expectPromiseToFailWithError,
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

const randomUser = new InclusionConnectedUserBuilder()
  .withId("not-an-admin-id")
  .withFirstName("John")
  .withIsAdmin(false)
  .withEstablishments(undefined)
  .build();

const adminUser = new InclusionConnectedUserBuilder()
  .withId("admin-id")
  .withFirstName("Admin")
  .withIsAdmin(true)
  .build();

describe("GetUserAgencyDashboardUrl", () => {
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

  describe("For getting the current user's data", () => {
    it("throws NotFoundError if the user is not found", async () => {
      await expectPromiseToFailWithError(
        getInclusionConnectedUser.execute({}, randomUser),
        errors.user.notFound({ userId: randomUser.id }),
      );
    });

    it("throws Forbidden if no user is provided", async () => {
      await expectPromiseToFailWithError(
        getInclusionConnectedUser.execute({}),
        errors.user.noJwtProvided(),
      );
    });

    const [
      agencyRolesAllowedToGetDashboard,
      agencyRolesForbiddenToGetDashboard,
    ] = splitCasesBetweenPassingAndFailing(allAgencyRoles, [
      "agency-admin",
      "validator",
      "counsellor",
      "agency-viewer",
    ]);

    it.each(agencyRolesAllowedToGetDashboard)(
      "returns the dashboard url when role is '%s'",
      async (agencyUserRole) => {
        const agency = new AgencyDtoBuilder().build();
        uow.userRepository.setInclusionConnectedUsers([
          {
            ...randomUser,
            agencyRights: [
              { agency, roles: [agencyUserRole], isNotifiedByEmail: false },
            ],
            dashboards: {
              agencies: {},
              establishments: {},
            },
          },
        ]);
        const url = await getInclusionConnectedUser.execute({}, randomUser);

        expectToEqual(url, {
          ...randomUser,
          agencyRights: [
            { agency, roles: [agencyUserRole], isNotifiedByEmail: false },
          ],
          dashboards: {
            agencies: {
              agencyDashboardUrl: `http://stubAgencyUserDashboard/${
                randomUser.id
              }/${timeGateway.now()}`,
              erroredConventionsDashboardUrl: `http://stubErroredConventionDashboard/${
                randomUser.id
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
          ...randomUser,
          agencyRights: [
            {
              agency: new AgencyDtoBuilder().build(),
              roles: [agencyUserRole],
              isNotifiedByEmail: false,
            },
          ],
          dashboards: { agencies: {}, establishments: {} },
        };
        uow.userRepository.setInclusionConnectedUsers([
          storedInclusionConnectedUser,
        ]);
        const inclusionConnectedUser = await getInclusionConnectedUser.execute(
          {},
          randomUser,
        );

        expectToEqual(inclusionConnectedUser, storedInclusionConnectedUser);
      },
    );

    it("the dashboard url should not include the agency ids where role is 'to-review'", async () => {
      const agencyBuilder = new AgencyDtoBuilder();
      const agency1 = agencyBuilder
        .withId("1111")
        .withKind("pole-emploi")
        .build();
      const agency2 = agencyBuilder.withId("2222").build();
      const agency3 = agencyBuilder.withId("3333").build();
      const agency4 = agencyBuilder.withId("4444").build();

      uow.userRepository.setInclusionConnectedUsers([
        {
          ...randomUser,
          agencyRights: [
            {
              agency: agency1,
              roles: ["counsellor"],
              isNotifiedByEmail: false,
            },
            { agency: agency2, roles: ["validator"], isNotifiedByEmail: false },
            { agency: agency3, roles: ["to-review"], isNotifiedByEmail: false },
            {
              agency: agency4,
              roles: ["agency-admin"],
              isNotifiedByEmail: false,
            },
          ],
          dashboards: { agencies: {}, establishments: {} },
        },
      ]);
      const url = await getInclusionConnectedUser.execute({}, randomUser);

      expectToEqual(url, {
        ...randomUser,
        agencyRights: [
          { agency: agency1, roles: ["counsellor"], isNotifiedByEmail: false },
          { agency: agency2, roles: ["validator"], isNotifiedByEmail: false },
          { agency: agency3, roles: ["to-review"], isNotifiedByEmail: false },
          {
            agency: agency4,
            roles: ["agency-admin"],
            isNotifiedByEmail: false,
          },
        ],
        dashboards: {
          agencies: {
            agencyDashboardUrl: `http://stubAgencyUserDashboard/${
              randomUser.id
            }/${timeGateway.now()}`,
            erroredConventionsDashboardUrl: `http://stubErroredConventionDashboard/${
              randomUser.id
            }/${timeGateway.now()}`,
          },
          establishments: {},
        },
      });
    });

    describe("establishment dashboards", () => {
      describe("convention", () => {
        it("retrieve dashboard when IC user is establishement rep in at least one convention", async () => {
          uow.userRepository.setInclusionConnectedUsers([
            {
              ...randomUser,
              dashboards: { agencies: {}, establishments: {} },
              agencyRights: [],
            },
          ]);
          const convention = new ConventionDtoBuilder()
            .withEstablishmentRepresentativeEmail(randomUser.email)
            .build();
          uow.conventionRepository.setConventions([convention]);

          const result = await getInclusionConnectedUser.execute(
            {},
            randomUser,
          );

          expectToEqual(result.dashboards, {
            agencies: {},
            establishments: {
              conventions: {
                url: `http://stubEstablishmentConventionsDashboardUrl/${
                  randomUser.id
                }/${timeGateway.now()}`,
                role: "establishment-representative",
              },
            },
          });
        });

        it("retrieve dashboard when IC user is establishement tutor in at least one convention", async () => {
          uow.userRepository.setInclusionConnectedUsers([
            {
              ...randomUser,
              agencyRights: [],
              dashboards: { agencies: {}, establishments: {} },
            },
          ]);
          const convention = new ConventionDtoBuilder()
            .withEstablishmentTutorEmail(randomUser.email)
            .build();
          uow.conventionRepository.setConventions([convention]);

          const result = await getInclusionConnectedUser.execute(
            {},
            randomUser,
          );

          expectToEqual(result.dashboards, {
            agencies: {},
            establishments: {
              conventions: {
                role: "establishment-tutor",
                url: `http://stubEstablishmentConventionsDashboardUrl/${
                  randomUser.id
                }/${timeGateway.now()}`,
              },
            },
          });
        });

        it("should retrieve dashboard when ic user is establishment representative and tutor for at least one convention", async () => {
          uow.userRepository.setInclusionConnectedUsers([
            {
              ...randomUser,
              agencyRights: [],
              dashboards: { agencies: {}, establishments: {} },
            },
          ]);
          const convention = new ConventionDtoBuilder()
            .withEstablishmentTutorEmail(randomUser.email)
            .withEstablishmentRepresentativeEmail(randomUser.email)
            .build();
          uow.conventionRepository.setConventions([convention]);

          const result = await getInclusionConnectedUser.execute(
            {},
            randomUser,
          );

          expectToEqual(result.dashboards, {
            agencies: {},
            establishments: {
              conventions: {
                url: `http://stubEstablishmentConventionsDashboardUrl/${
                  randomUser.id
                }/${timeGateway.now()}`,
                role: "establishment-representative",
              },
            },
          });
        });

        it("do not retrieve dashboard when IC user is not establishement tutor or respresentative in any conventions", async () => {
          uow.userRepository.setInclusionConnectedUsers([
            {
              ...randomUser,
              agencyRights: [],
              dashboards: { agencies: {}, establishments: {} },
            },
          ]);

          const result = await getInclusionConnectedUser.execute(
            {},
            randomUser,
          );

          expectToEqual(result.dashboards, {
            agencies: {},
            establishments: {},
          });
        });
      });

      describe("discussions", () => {
        it("retrieve dashboard when IC user is establishment contact for at least one discussion", async () => {
          uow.userRepository.setInclusionConnectedUsers([
            {
              ...randomUser,
              dashboards: { agencies: {}, establishments: {} },
              agencyRights: [],
            },
          ]);
          uow.discussionRepository.discussions = [
            new DiscussionBuilder()
              .withEstablishmentContact({
                email: randomUser.email,
              })
              .build(),
          ];

          const result = await getInclusionConnectedUser.execute(
            {},
            randomUser,
          );

          expectToEqual(result.dashboards, {
            agencies: {},
            establishments: {
              discussions: `http://stubEstablishmentDiscussionsDashboardUrl/${
                randomUser.id
              }/${timeGateway.now()}`,
            },
          });
        });

        it("retrieves dashboard when IC user is establishment contact copy email of a discussion", async () => {
          uow.userRepository.setInclusionConnectedUsers([
            {
              ...randomUser,
              dashboards: { agencies: {}, establishments: {} },
              agencyRights: [],
            },
          ]);
          uow.discussionRepository.discussions = [
            new DiscussionBuilder()
              .withEstablishmentContact({
                email: "other@mail.com",
                copyEmails: [randomUser.email],
              })
              .build(),
          ];
          const result = await getInclusionConnectedUser.execute(
            {},
            randomUser,
          );

          expectToEqual(result.dashboards, {
            agencies: {},
            establishments: {
              discussions: `http://stubEstablishmentDiscussionsDashboardUrl/${
                randomUser.id
              }/${timeGateway.now()}`,
            },
          });
        });

        it("do not retrieve dashboard when IC user is not establishment contact in any discussion", async () => {
          uow.userRepository.setInclusionConnectedUsers([
            {
              ...randomUser,
              agencyRights: [],
              dashboards: { agencies: {}, establishments: {} },
            },
          ]);

          const result = await getInclusionConnectedUser.execute(
            {},
            randomUser,
          );

          expectToEqual(result.dashboards, {
            agencies: {},
            establishments: {},
          });
        });
      });

      describe("establishments", () => {
        it("retrieve establishments when IC user is establishment rep in at least one establishment", async () => {
          uow.userRepository.setInclusionConnectedUsers([
            {
              ...randomUser,
              dashboards: { agencies: {}, establishments: {} },
              agencyRights: [],
            },
          ]);

          const fakeBusinessContact = new ContactEntityBuilder()
            .withEmail(randomUser.email)
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
            {},
            randomUser,
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

        it("do not retrieve establishment when IC user is not establishment representative in at least one establishment", async () => {
          uow.userRepository.setInclusionConnectedUsers([
            {
              ...randomUser,
              agencyRights: [],
              dashboards: { agencies: {}, establishments: {} },
            },
          ]);
          const convention = new ConventionDtoBuilder()
            .withEstablishmentTutorEmail(randomUser.email)
            .build();
          uow.conventionRepository.setConventions([convention]);

          const result = await getInclusionConnectedUser.execute(
            {},
            randomUser,
          );

          expectToEqual(result.establishments, undefined);
        });
      });
    });
  });

  describe("for an admin getting another user's data", () => {
    it("throws if currentUser is not admin", async () => {
      await expectPromiseToFailWithError(
        getInclusionConnectedUser.execute({ userId: "yolo" }, randomUser),
        errors.user.forbidden({ userId: randomUser.id }),
      );
    });

    it("gets another user's data if currentUser is admin", async () => {
      uow.userRepository.setInclusionConnectedUsers([randomUser]);
      const fetchedUser = await getInclusionConnectedUser.execute(
        { userId: randomUser.id },
        adminUser,
      );
      expectToEqual(fetchedUser, randomUser);
    });
  });
});
