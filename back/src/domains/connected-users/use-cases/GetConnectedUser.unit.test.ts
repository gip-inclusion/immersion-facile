import {
  AgencyDtoBuilder,
  allAgencyRoles,
  type ConnectedUser,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
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
  const now = new Date();

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
  const adminUserBuilder = new ConnectedUserBuilder()
    .withId("admin-id")
    .withFirstName("Admin")
    .withIsAdmin(true);

  const connectedAdminUser = adminUserBuilder.build();
  const admin = adminUserBuilder.buildUser();

  const notAdminUser = notAdminBuilder.buildUser();
  const connectedNotAdminUser = notAdminBuilder.build();

  const anotherUser = anotherUserBuilder.build();

  const agencyWithoutCounsellorAndValidatorBuilder = new AgencyDtoBuilder();

  let getConnectedUser: GetConnectedUser;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway(now);
    getConnectedUser = new GetConnectedUser(
      new InMemoryUowPerformer(uow),
      new StubDashboardGateway(),
      timeGateway,
    );
    uow.userRepository.users = [notAdminUser, anotherUser, admin];
  });

  describe("When a user get it's own user datas", () => {
    describe("wrong paths", () => {
      it("throws NotFoundError if the user is not found", async () => {
        uow.userRepository.users = [];

        await expectPromiseToFailWithError(
          getConnectedUser.execute({}, connectedNotAdminUser),
          errors.user.notFound({ userId: notAdminUser.id }),
        );
      });
      it("throws Forbidden if no user is provided", async () => {
        await expectPromiseToFailWithError(
          getConnectedUser.execute({}),
          errors.user.noJwtProvided(),
        );
      });
    });

    describe("agency user infos", () => {
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

      describe("returns agency rights with agency dashboards", () => {
        it.each(agencyRolesAllowedToGetDashboard)(
          "when role is '%s'",
          async (agencyUserRole) => {
            const agency = agencyWithoutCounsellorAndValidatorBuilder
              .withKind("pole-emploi")
              .build();

            uow.agencyRepository.agencies = [
              toAgencyWithRights(agency, {
                [notAdminUser.id]: {
                  roles: [agencyUserRole],
                  isNotifiedByEmail: true,
                },
              }),
            ];

            const user = await getConnectedUser.execute(
              {},
              connectedNotAdminUser,
            );

            expectToEqual(user, {
              ...notAdminUser,
              agencyRights: [
                {
                  agency: toAgencyDtoForAgencyUsersAndAdmins(
                    agency,
                    agencyUserRole === "agency-admin"
                      ? [connectedNotAdminUser.email]
                      : [],
                  ),
                  roles: [agencyUserRole],
                  isNotifiedByEmail: true,
                },
              ],
              dashboards: {
                agencies: {
                  erroredConventionsDashboardUrl: `http://stubErroredConventionDashboard/${
                    connectedNotAdminUser.id
                  }/${timeGateway.now()}`,
                  agencyDashboardUrl: `http://stubAgencyUserDashboard/${
                    connectedNotAdminUser.id
                  }/${timeGateway.now()}`,
                  statsAgenciesUrl: `http://stubStatsAgenciesDashboard/${timeGateway.now()}`,
                  statsEstablishmentDetailsUrl: `http://stubStatsEstablishmentDetailsDashboard/${timeGateway.now()}`,
                  statsConventionsByEstablishmentByDepartmentUrl: `http://stubStatsConventionsByEstablishmentByDepartmentDashboard/${timeGateway.now()}`,
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
            uow.userRepository.users = [notAdminUser];
            uow.agencyRepository.agencies = [
              toAgencyWithRights(agency, {
                [notAdminUser.id]: {
                  roles: [agencyUserRole],
                  isNotifiedByEmail: true,
                },
              }),
            ];

            expectToEqual(
              await getConnectedUser.execute({}, connectedNotAdminUser),
              {
                ...notAdminUser,
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

        uow.userRepository.users = [notAdminUser];
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [notAdminUser.id]: {
              roles: ["validator"],
              isNotifiedByEmail: false,
            },
          }),
        ];
        const url = await getConnectedUser.execute({}, connectedNotAdminUser);

        expectToEqual(url, {
          ...notAdminUser,
          agencyRights: [
            {
              agency: toAgencyDtoForAgencyUsersAndAdmins(agency, []),
              roles: ["validator"],
              isNotifiedByEmail: false,
            },
          ],
          dashboards: {
            agencies: {
              agencyDashboardUrl: `http://stubAgencyUserDashboard/${
                notAdminUser.id
              }/${timeGateway.now()}`,
              erroredConventionsDashboardUrl: undefined,
              statsAgenciesUrl: `http://stubStatsAgenciesDashboard/${timeGateway.now()}`,
              statsEstablishmentDetailsUrl: `http://stubStatsEstablishmentDetailsDashboard/${timeGateway.now()}`,
              statsConventionsByEstablishmentByDepartmentUrl: `http://stubStatsConventionsByEstablishmentByDepartmentDashboard/${timeGateway.now()}`,
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

        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency1, {
            [notAdminUser.id]: {
              roles: ["counsellor"],
              isNotifiedByEmail: true,
            },
          }),
          toAgencyWithRights(agency2, {
            [notAdminUser.id]: {
              roles: ["validator"],
              isNotifiedByEmail: true,
            },
          }),
          toAgencyWithRights(agency3, {
            [notAdminUser.id]: {
              roles: ["to-review"],
              isNotifiedByEmail: true,
            },
          }),
          toAgencyWithRights(agency4, {
            [notAdminUser.id]: {
              roles: ["agency-admin"],
              isNotifiedByEmail: true,
            },
          }),
        ];

        const user = await getConnectedUser.execute({}, connectedNotAdminUser);

        expectToEqual(user, {
          ...notAdminUser,
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
                notAdminUser.email,
              ]),
              roles: ["agency-admin"],
              isNotifiedByEmail: true,
            },
          ],
          dashboards: {
            agencies: {
              agencyDashboardUrl: `http://stubAgencyUserDashboard/${
                notAdminUser.id
              }/${timeGateway.now()}`,
              erroredConventionsDashboardUrl: `http://stubErroredConventionDashboard/${
                notAdminUser.id
              }/${timeGateway.now()}`,
              statsAgenciesUrl: `http://stubStatsAgenciesDashboard/${timeGateway.now()}`,
              statsEstablishmentDetailsUrl: `http://stubStatsEstablishmentDetailsDashboard/${timeGateway.now()}`,
              statsConventionsByEstablishmentByDepartmentUrl: `http://stubStatsConventionsByEstablishmentByDepartmentDashboard/${timeGateway.now()}`,
            },
            establishments: {},
          },
        });
      });

      describe("establishment user infos", () => {
        it("do NOT retrieve any establishment user infos when user is not establishment tutor or respresentative in any conventions nor has any role in the establishment", async () => {
          expectToEqual(
            await getConnectedUser.execute({}, connectedNotAdminUser),
            {
              ...notAdminUser,
              agencyRights: [],
              dashboards: {
                agencies: {},
                establishments: {},
              },
            },
          );
        });

        describe("get only convention dashboard without establishment rights when user don't have establishment rights", () => {
          const expectedUserWithEstablishmentConventionDashboardOnly: ConnectedUser =
            {
              ...notAdminUser,
              agencyRights: [],
              dashboards: {
                agencies: {},
                establishments: {
                  conventions: `http://stubEstablishmentConventionsDashboardUrl/${notAdminUser.id}/${now}`,
                },
              },
            };

          it("and user is establishement representative in at least one convention", async () => {
            const convention = new ConventionDtoBuilder()
              .withEstablishmentRepresentativeEmail(notAdminUser.email)
              .build();

            uow.conventionRepository.setConventions([convention]);

            expectToEqual(
              await getConnectedUser.execute({}, connectedNotAdminUser),
              expectedUserWithEstablishmentConventionDashboardOnly,
            );
          });

          it("and user is establishement tutor in at least one convention", async () => {
            const convention = new ConventionDtoBuilder()
              .withEstablishmentTutorEmail(notAdminUser.email)
              .build();
            uow.conventionRepository.setConventions([convention]);

            expectToEqual(
              await getConnectedUser.execute({}, connectedNotAdminUser),
              expectedUserWithEstablishmentConventionDashboardOnly,
            );
          });

          it("and user is establishment representative and tutor for at least one convention", async () => {
            const convention = new ConventionDtoBuilder()
              .withEstablishmentTutorEmail(notAdminUser.email)
              .withEstablishmentRepresentativeEmail(notAdminUser.email)
              .build();
            uow.conventionRepository.setConventions([convention]);

            expectToEqual(
              await getConnectedUser.execute({}, connectedNotAdminUser),
              expectedUserWithEstablishmentConventionDashboardOnly,
            );
          });
        });

        describe("when user have establishment rights", () => {
          const establishmentUserRightsForFirstEstablishment: EstablishmentUserRight[] =
            [
              {
                job: "Chef",
                role: "establishment-admin",
                userId: notAdminUser.id,
                phone: "+33600000000",
                shouldReceiveDiscussionNotifications: true,
              },
              {
                job: "Dev",
                role: "establishment-admin",
                userId: anotherUser.id,
                phone: "+33600000001",
                shouldReceiveDiscussionNotifications: true,
              },
            ];

          const establishmentUserRightsForSecondEstablishment: EstablishmentUserRight[] =
            [
              {
                job: "Chef",
                role: "establishment-contact",
                userId: notAdminUser.id,
                phone: "+33600000000",
                shouldReceiveDiscussionNotifications: true,
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

          beforeEach(() => {
            uow.establishmentAggregateRepository.establishmentAggregates = [
              establishmentAggregate1,
              establishmentAggregate2,
            ];
          });

          it("retrieve establishments rights and discussions / conventions dashboards when user have right on at least one establishment even if there is no conventions/discussion for establishment", async () => {
            uow.conventionRepository.setConventions([]);
            uow.discussionRepository.discussions = [];

            expectToEqual(
              await getConnectedUser.execute({}, connectedNotAdminUser),
              {
                ...connectedNotAdminUser,
                establishments: [
                  {
                    siret: establishmentAggregate1.establishment.siret,
                    businessName:
                      establishmentAggregate1.establishment.customizedName ??
                      establishmentAggregate1.establishment.name,
                    role: "establishment-admin",
                    admins: [
                      {
                        email: notAdminUser.email,
                        firstName: notAdminUser.firstName,
                        lastName: notAdminUser.lastName,
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
                      notAdminUser.id
                    }/${timeGateway.now()}`,
                    discussions: `http://stubEstablishmentDiscussionsDashboardUrl/${
                      notAdminUser.id
                    }/${timeGateway.now()}`,
                  },
                },
              },
            );
          });
        });
      });
    });

    describe("When a backoffice admin user gets another user's datas", () => {
      it("throws if currentUser is not admin", async () => {
        await expectPromiseToFailWithError(
          getConnectedUser.execute({ userId: admin.id }, connectedNotAdminUser),
          errors.user.forbidden({ userId: connectedNotAdminUser.id }),
        );
      });

      it("gets another user's data if currentUser is admin", async () => {
        const fetchedUser = await getConnectedUser.execute(
          { userId: notAdminUser.id },
          connectedAdminUser,
        );
        expectToEqual(fetchedUser, {
          ...notAdminUser,
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
});
