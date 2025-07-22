import {
  AgencyDtoBuilder,
  allAgencyRoles,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  DiscussionBuilder,
  defaultProConnectInfos,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  splitCasesBetweenPassingAndFailing,
  toAgencyDtoForAgencyUsersAndAdmins,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { StubDashboardGateway } from "../../core/dashboard/adapters/StubDashboardGateway";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import type { EstablishmentUserRight } from "../../establishment/entities/EstablishmentAggregate";
import { EstablishmentAggregateBuilder } from "../../establishment/helpers/EstablishmentBuilders";
import { GetConnectedUser } from "./GetConnectedUser";

describe("GetConnectedUser", () => {
  const notAdminBuilder = new ConnectedUserBuilder()
    .withId("not-an-admin-id")
    .withFirstName("Francis")
    .withLastName("Lemoine")
    .withEmail("francis.lemoine@mail.com")
    .withIsAdmin(false)
    .withEstablishments(undefined);
  const anotherUserBuilder = new ConnectedUserBuilder()
    .withId("another-user-id")
    .withFirstName("Billy")
    .withLastName("Idol")
    .withEmail("billy.idol@mail.com")
    .withIsAdmin(false)
    .withEstablishments(undefined);
  const connectedUserNotAdmin = notAdminBuilder.build();
  const notAdmin = notAdminBuilder.buildUser();
  const anotherUser = anotherUserBuilder.build();

  const agencyWithoutCounsellorAndValidatorBuilder = new AgencyDtoBuilder();

  let getConnectedUser: GetConnectedUser;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    getConnectedUser = new GetConnectedUser(
      new InMemoryUowPerformer(uow),
      new StubDashboardGateway(),
      timeGateway,
    );
  });

  describe("For getting the current user's data", () => {
    it("throws NotFoundError if the user is not found", async () => {
      await expectPromiseToFailWithError(
        getConnectedUser.execute({}, connectedUserNotAdmin),
        errors.user.notFound({ userId: notAdmin.id }),
      );
    });

    it("throws Forbidden if no user is provided", async () => {
      await expectPromiseToFailWithError(
        getConnectedUser.execute({}),
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

    const agency = agencyWithoutCounsellorAndValidatorBuilder.build();

    describe("returns the dashboard url", () => {
      it.each(agencyRolesAllowedToGetDashboard)(
        "when role is '%s'",
        async (agencyUserRole) => {
          const agency = agencyWithoutCounsellorAndValidatorBuilder
            .withKind("pole-emploi")
            .build();

          uow.userRepository.users = [notAdmin];
          uow.agencyRepository.agencies = [
            toAgencyWithRights(agency, {
              [notAdmin.id]: {
                roles: [agencyUserRole],
                isNotifiedByEmail: true,
              },
            }),
          ];

          const user = await getConnectedUser.execute(
            {},
            connectedUserNotAdmin,
          );

          expectToEqual(user, {
            ...connectedUserNotAdmin,
            agencyRights: [
              {
                agency: toAgencyDtoForAgencyUsersAndAdmins(
                  agency,
                  agencyUserRole === "agency-admin"
                    ? [connectedUserNotAdmin.email]
                    : [],
                ),
                roles: [agencyUserRole],
                isNotifiedByEmail: true,
              },
            ],
            dashboards: {
              agencies: {
                erroredConventionsDashboardUrl: `http://stubErroredConventionDashboard/${
                  notAdmin.id
                }/${timeGateway.now()}`,
                agencyDashboardUrl: `http://stubAgencyUserDashboard/${
                  notAdmin.id
                }/${timeGateway.now()}`,
                statsAgenciesUrl: `http://stubStatsAgenciesDashboard/${
                  notAdmin.id
                }/${timeGateway.now()}`,
                statsEstablishmentDetailsUrl: `http://stubStatsEstablishmentDetailsDashboard/${
                  notAdmin.id
                }/${timeGateway.now()}`,
                statsConventionsByEstablishmentByDepartmentUrl: `http://stubStatsConventionsByEstablishmentByDepartmentDashboard/${
                  notAdmin.id
                }/${timeGateway.now()}`,
              },
              establishments: {},
            },
          });
        },
      );
    });

    describe("gets the user without dashboard url", () => {
      it.each(agencyRolesForbiddenToGetDashboard)(
        "for role '%s'",
        async (agencyUserRole) => {
          uow.userRepository.users = [notAdmin];
          uow.agencyRepository.agencies = [
            toAgencyWithRights(agency, {
              [notAdmin.id]: {
                roles: [agencyUserRole],
                isNotifiedByEmail: true,
              },
            }),
          ];

          expectToEqual(
            await getConnectedUser.execute({}, connectedUserNotAdmin),
            {
              ...notAdmin,
              proConnect: defaultProConnectInfos,
              agencyRights: [
                {
                  agency: toAgencyDtoForAgencyUsersAndAdmins(agency, []),
                  roles: [agencyUserRole],
                  isNotifiedByEmail: true,
                },
              ],
              dashboards: { agencies: {}, establishments: {} },
            },
          );
        },
      );
    });

    it("returns the erroredConventionsDashboardUrl to undefined when agency is not of kind with synchronisation enabled", async () => {
      const agency = new AgencyDtoBuilder().withKind("autre").build();

      uow.userRepository.users = [connectedUserNotAdmin];
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [notAdmin.id]: {
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        }),
      ];
      const url = await getConnectedUser.execute({}, connectedUserNotAdmin);

      expectToEqual(url, {
        ...connectedUserNotAdmin,
        agencyRights: [
          {
            agency: toAgencyDtoForAgencyUsersAndAdmins(agency, []),
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        ],
        dashboards: {
          agencies: {
            erroredConventionsDashboardUrl: undefined,
            agencyDashboardUrl: `http://stubAgencyUserDashboard/${
              connectedUserNotAdmin.id
            }/${timeGateway.now()}`,
            statsAgenciesUrl: `http://stubStatsAgenciesDashboard/${
              notAdmin.id
            }/${timeGateway.now()}`,
            statsEstablishmentDetailsUrl: `http://stubStatsEstablishmentDetailsDashboard/${
              notAdmin.id
            }/${timeGateway.now()}`,
            statsConventionsByEstablishmentByDepartmentUrl: `http://stubStatsConventionsByEstablishmentByDepartmentDashboard/${
              notAdmin.id
            }/${timeGateway.now()}`,
          },
          establishments: {},
        },
      });
    });

    it("the dashboard url should not include the agency ids where role is 'to-review'", async () => {
      const agencyBuilder = new AgencyDtoBuilder();

      const agency1 = agencyBuilder
        .withId("1111")
        .withKind("pole-emploi")
        .build();
      const agency2 = agencyBuilder.withId("2222").build();
      const agency3 = agencyBuilder.withId("3333").build();
      const agency4 = agencyBuilder.withId("4444").build();

      uow.userRepository.users = [notAdmin];
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency1, {
          [notAdmin.id]: {
            roles: ["counsellor"],
            isNotifiedByEmail: true,
          },
        }),
        toAgencyWithRights(agency2, {
          [notAdmin.id]: {
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
        }),
        toAgencyWithRights(agency3, {
          [notAdmin.id]: {
            roles: ["to-review"],
            isNotifiedByEmail: true,
          },
        }),
        toAgencyWithRights(agency4, {
          [notAdmin.id]: {
            roles: ["agency-admin"],
            isNotifiedByEmail: true,
          },
        }),
      ];

      const user = await getConnectedUser.execute({}, connectedUserNotAdmin);

      expectToEqual(user, {
        ...notAdmin,
        proConnect: defaultProConnectInfos,
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
          {
            agency: toAgencyDtoForAgencyUsersAndAdmins(agency3, []),
            roles: ["to-review"],
            isNotifiedByEmail: true,
          },
          {
            agency: toAgencyDtoForAgencyUsersAndAdmins(agency4, [
              notAdmin.email,
            ]),
            roles: ["agency-admin"],
            isNotifiedByEmail: true,
          },
        ],
        dashboards: {
          agencies: {
            agencyDashboardUrl: `http://stubAgencyUserDashboard/${
              notAdmin.id
            }/${timeGateway.now()}`,
            erroredConventionsDashboardUrl: `http://stubErroredConventionDashboard/${
              notAdmin.id
            }/${timeGateway.now()}`,
            statsAgenciesUrl: `http://stubStatsAgenciesDashboard/${
              notAdmin.id
            }/${timeGateway.now()}`,
            statsEstablishmentDetailsUrl: `http://stubStatsEstablishmentDetailsDashboard/${
              notAdmin.id
            }/${timeGateway.now()}`,
            statsConventionsByEstablishmentByDepartmentUrl: `http://stubStatsConventionsByEstablishmentByDepartmentDashboard/${
              notAdmin.id
            }/${timeGateway.now()}`,
          },
          establishments: {},
        },
      });
    });

    describe("establishment dashboards", () => {
      describe("convention", () => {
        it("retrieve dashboard when IC user is establishement rep in at least one convention", async () => {
          uow.userRepository.users = [notAdmin];
          const convention = new ConventionDtoBuilder()
            .withEstablishmentRepresentativeEmail(notAdmin.email)
            .build();
          uow.conventionRepository.setConventions([convention]);

          const result = await getConnectedUser.execute(
            {},
            connectedUserNotAdmin,
          );

          expectToEqual(result.dashboards, {
            agencies: {},
            establishments: {
              conventions: `http://stubEstablishmentConventionsDashboardUrl/${
                notAdmin.id
              }/${timeGateway.now()}`,
            },
          });
        });

        it("retrieve dashboard when IC user is establishement tutor in at least one convention", async () => {
          uow.userRepository.users = [notAdmin];

          const convention = new ConventionDtoBuilder()
            .withEstablishmentTutorEmail(notAdmin.email)
            .build();
          uow.conventionRepository.setConventions([convention]);

          const result = await getConnectedUser.execute(
            {},
            connectedUserNotAdmin,
          );

          expectToEqual(result.dashboards, {
            agencies: {},
            establishments: {
              conventions: `http://stubEstablishmentConventionsDashboardUrl/${
                notAdmin.id
              }/${timeGateway.now()}`,
            },
          });
        });

        it("should retrieve dashboard when ic user is establishment representative and tutor for at least one convention", async () => {
          uow.userRepository.users = [notAdmin];

          const convention = new ConventionDtoBuilder()
            .withEstablishmentTutorEmail(notAdmin.email)
            .withEstablishmentRepresentativeEmail(notAdmin.email)
            .build();
          uow.conventionRepository.setConventions([convention]);

          const result = await getConnectedUser.execute(
            {},
            connectedUserNotAdmin,
          );

          expectToEqual(result.dashboards, {
            agencies: {},
            establishments: {
              conventions: `http://stubEstablishmentConventionsDashboardUrl/${
                notAdmin.id
              }/${timeGateway.now()}`,
            },
          });
        });

        it("do NOT retrieve dashboard when user is not establishment tutor or respresentative in any conventions nor has any role in the establishment", async () => {
          uow.userRepository.users = [notAdmin];

          const result = await getConnectedUser.execute(
            {},
            connectedUserNotAdmin,
          );

          expectToEqual(result.dashboards, {
            agencies: {},
            establishments: {},
          });
        });
      });

      describe("discussions", () => {
        it("retrieve dashboard when IC user is establishment contact for at least one discussion", async () => {
          uow.userRepository.users = [notAdmin];

          uow.discussionRepository.discussions = [
            new DiscussionBuilder()
              .withEstablishmentContact({
                email: notAdmin.email,
              })
              .build(),
          ];

          const result = await getConnectedUser.execute(
            {},
            connectedUserNotAdmin,
          );

          expectToEqual(result.dashboards, {
            agencies: {},
            establishments: {
              discussions: `http://stubEstablishmentDiscussionsDashboardUrl/${
                notAdmin.id
              }/${timeGateway.now()}`,
            },
          });
        });

        it("retrieves dashboard when IC user is establishment contact copy email of a discussion", async () => {
          uow.userRepository.users = [notAdmin];
          uow.discussionRepository.discussions = [
            new DiscussionBuilder()
              .withEstablishmentContact({
                email: "other@mail.com",
                copyEmails: [notAdmin.email],
              })
              .build(),
          ];
          const result = await getConnectedUser.execute(
            {},
            connectedUserNotAdmin,
          );

          expectToEqual(result.dashboards, {
            agencies: {},
            establishments: {
              discussions: `http://stubEstablishmentDiscussionsDashboardUrl/${
                notAdmin.id
              }/${timeGateway.now()}`,
            },
          });
        });

        it("do NOT retrieve dashboard when user is not establishment contact in any discussion, nor has any role in the establishment", async () => {
          uow.userRepository.users = [notAdmin];

          const result = await getConnectedUser.execute(
            {},
            connectedUserNotAdmin,
          );

          expectToEqual(result.dashboards, {
            agencies: {},
            establishments: {},
          });
        });
      });

      describe("establishments", () => {
        it("retrieve establishments and discussions and conventions dashboards when IC user is establishement rep in at least one establishment", async () => {
          uow.userRepository.users = [notAdmin, anotherUser];

          const establishmentUserRightsForFirstEstablishment: EstablishmentUserRight[] =
            [
              {
                job: "Chef",
                role: "establishment-admin",
                userId: notAdmin.id,
                phone: "+33600000000",
              },
              {
                job: "Dev",
                role: "establishment-admin",
                userId: anotherUser.id,
                phone: "+33600000001",
              },
            ];

          const establishmentUserRightsForSecondEstablishment: EstablishmentUserRight[] =
            [
              {
                job: "Chef",
                role: "establishment-contact",
                userId: notAdmin.id,
                phone: "+33600000000",
              },
            ];

          const establishmentAggregate1 = new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("89114285300012")
            .withUserRights(establishmentUserRightsForFirstEstablishment)
            .build();

          const establishmentAggregate2 = new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("89114285300013")
            .withUserRights(establishmentUserRightsForSecondEstablishment)
            .build();

          uow.establishmentAggregateRepository.establishmentAggregates = [
            establishmentAggregate1,
            establishmentAggregate2,
          ];

          const result = await getConnectedUser.execute(
            {},
            connectedUserNotAdmin,
          );

          expectToEqual(result, {
            ...connectedUserNotAdmin,
            establishments: [
              {
                siret: establishmentAggregate1.establishment.siret,
                businessName:
                  establishmentAggregate1.establishment.customizedName ??
                  establishmentAggregate1.establishment.name,
                role: "establishment-admin",
                admins: [
                  {
                    email: notAdmin.email,
                    firstName: notAdmin.firstName,
                    lastName: notAdmin.lastName,
                  },
                  {
                    email: anotherUser.email,
                    firstName: anotherUser.firstName,
                    lastName: anotherUser.lastName,
                  },
                ],
              },
              {
                siret: establishmentAggregate2.establishment.siret,
                businessName:
                  establishmentAggregate2.establishment.customizedName ??
                  establishmentAggregate2.establishment.name,
                role: "establishment-contact",
                admins: [],
              },
            ],
            dashboards: {
              agencies: {},
              establishments: {
                conventions: `http://stubEstablishmentConventionsDashboardUrl/${
                  notAdmin.id
                }/${timeGateway.now()}`,
                discussions: `http://stubEstablishmentDiscussionsDashboardUrl/${
                  notAdmin.id
                }/${timeGateway.now()}`,
              },
            },
          });
        });

        it("do not retrieve establishment when IC user is not establishment representative in at least one establishment", async () => {
          uow.userRepository.users = [notAdmin];

          const convention = new ConventionDtoBuilder()
            .withEstablishmentTutorEmail(notAdmin.email)
            .build();
          uow.conventionRepository.setConventions([convention]);

          const result = await getConnectedUser.execute(
            {},
            connectedUserNotAdmin,
          );

          expectToEqual(result.establishments, undefined);
        });
      });
    });
  });
  describe("for an admin getting another user's data", () => {
    const adminUserBuilder = new ConnectedUserBuilder()
      .withId("admin-id")
      .withFirstName("Admin")
      .withIsAdmin(true);
    const connectedAdminUser = adminUserBuilder.build();
    const admin = adminUserBuilder.buildUser();

    beforeEach(() => {
      uow.userRepository.users = [notAdmin, admin];
    });

    it("throws if currentUser is not admin", async () => {
      await expectPromiseToFailWithError(
        getConnectedUser.execute({ userId: admin.id }, connectedUserNotAdmin),
        errors.user.forbidden({ userId: connectedUserNotAdmin.id }),
      );
    });

    it("gets another user's data if currentUser is admin", async () => {
      const fetchedUser = await getConnectedUser.execute(
        { userId: notAdmin.id },
        connectedAdminUser,
      );
      expectToEqual(fetchedUser, {
        ...notAdmin,
        proConnect: defaultProConnectInfos,
        dashboards: {
          agencies: {},
          establishments: {},
        },
        agencyRights: [],
      });
    });
  });
});
