import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  DiscussionBuilder,
  InclusionConnectedUserBuilder,
  allAgencyRoles,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  splitCasesBetweenPassingAndFailing,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
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
  const notAdminBuilder = new InclusionConnectedUserBuilder()
    .withId("not-an-admin-id")
    .withFirstName("John")
    .withIsAdmin(false)
    .withEstablishments(undefined);
  const icNotAdmin = notAdminBuilder.build();
  const notAdmin = notAdminBuilder.buildUser();

  const agencyWithoutCounsellorAndValidatorBuilder = new AgencyDtoBuilder();

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
        getInclusionConnectedUser.execute({}, icNotAdmin),
        errors.user.notFound({ userId: notAdmin.id }),
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

    describe("returns the dashboard url", () => {
      it.each(agencyRolesAllowedToGetDashboard)(
        "when role is '%s'",
        async (agencyUserRole) => {
          const agency = agencyWithoutCounsellorAndValidatorBuilder.build();

          uow.userRepository.users = [notAdmin];
          uow.agencyRepository.agencies = [
            toAgencyWithRights(agency, {
              [notAdmin.id]: {
                roles: [agencyUserRole],
                isNotifiedByEmail: true,
              },
            }),
          ];

          const user = await getInclusionConnectedUser.execute({}, icNotAdmin);

          expectToEqual(user, {
            ...icNotAdmin,
            agencyRights: [
              {
                agency: {
                  ...agency,
                  ...(agencyUserRole === "counsellor"
                    ? { counsellorEmails: [notAdmin.email] }
                    : {}),
                  ...(agencyUserRole === "validator"
                    ? { validatorEmails: [notAdmin.email] }
                    : {}),
                },
                roles: [agencyUserRole],
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
          const agency = agencyWithoutCounsellorAndValidatorBuilder.build();

          uow.userRepository.users = [notAdmin];
          uow.agencyRepository.agencies = [
            toAgencyWithRights(agency, {
              [notAdmin.id]: {
                roles: [agencyUserRole],
                isNotifiedByEmail: true,
              },
            }),
          ];

          const inclusionConnectedUser =
            await getInclusionConnectedUser.execute({}, icNotAdmin);

          expectToEqual(inclusionConnectedUser, {
            ...notAdmin,
            agencyRights: [
              { agency, roles: [agencyUserRole], isNotifiedByEmail: true },
            ],
            dashboards: { agencies: {}, establishments: {} },
          });
        },
      );
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

      const user = await getInclusionConnectedUser.execute({}, icNotAdmin);

      expectToEqual(user, {
        ...notAdmin,
        agencyRights: [
          {
            agency: { ...agency1, counsellorEmails: [notAdmin.email] },
            isNotifiedByEmail: true,
            roles: ["counsellor"],
          },
          {
            agency: {
              ...agency2,
              validatorEmails: [notAdmin.email],
            },
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
          { agency: agency3, roles: ["to-review"], isNotifiedByEmail: true },
          {
            agency: agency4,
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

          const result = await getInclusionConnectedUser.execute(
            {},
            icNotAdmin,
          );

          expectToEqual(result.dashboards, {
            agencies: {},
            establishments: {
              conventions: {
                url: `http://stubEstablishmentConventionsDashboardUrl/${
                  notAdmin.id
                }/${timeGateway.now()}`,
                role: "establishment-representative",
              },
            },
          });
        });

        it("retrieve dashboard when IC user is establishement tutor in at least one convention", async () => {
          uow.userRepository.users = [notAdmin];

          const convention = new ConventionDtoBuilder()
            .withEstablishmentTutorEmail(notAdmin.email)
            .build();
          uow.conventionRepository.setConventions([convention]);

          const result = await getInclusionConnectedUser.execute(
            {},
            icNotAdmin,
          );

          expectToEqual(result.dashboards, {
            agencies: {},
            establishments: {
              conventions: {
                role: "establishment-tutor",
                url: `http://stubEstablishmentConventionsDashboardUrl/${
                  notAdmin.id
                }/${timeGateway.now()}`,
              },
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

          const result = await getInclusionConnectedUser.execute(
            {},
            icNotAdmin,
          );

          expectToEqual(result.dashboards, {
            agencies: {},
            establishments: {
              conventions: {
                url: `http://stubEstablishmentConventionsDashboardUrl/${
                  notAdmin.id
                }/${timeGateway.now()}`,
                role: "establishment-representative",
              },
            },
          });
        });

        it("do not retrieve dashboard when IC user is not establishement tutor or respresentative in any conventions", async () => {
          uow.userRepository.users = [notAdmin];

          const result = await getInclusionConnectedUser.execute(
            {},
            icNotAdmin,
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

          const result = await getInclusionConnectedUser.execute(
            {},
            icNotAdmin,
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
          const result = await getInclusionConnectedUser.execute(
            {},
            icNotAdmin,
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

        it("do not retrieve dashboard when IC user is not establishment contact in any discussion", async () => {
          uow.userRepository.users = [notAdmin];

          const result = await getInclusionConnectedUser.execute(
            {},
            icNotAdmin,
          );

          expectToEqual(result.dashboards, {
            agencies: {},
            establishments: {},
          });
        });
      });

      describe("establishments", () => {
        it("retrieve establishments when IC user is establishement rep in at least one establishment", async () => {
          uow.userRepository.users = [notAdmin];

          const fakeBusinessContact = new ContactEntityBuilder()
            .withEmail(notAdmin.email)
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
            icNotAdmin,
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
          uow.userRepository.users = [notAdmin];

          const convention = new ConventionDtoBuilder()
            .withEstablishmentTutorEmail(notAdmin.email)
            .build();
          uow.conventionRepository.setConventions([convention]);

          const result = await getInclusionConnectedUser.execute(
            {},
            icNotAdmin,
          );

          expectToEqual(result.establishments, undefined);
        });
      });
    });
  });
  describe("for an admin getting another user's data", () => {
    const adminUserBuilder = new InclusionConnectedUserBuilder()
      .withId("admin-id")
      .withFirstName("Admin")
      .withIsAdmin(true);
    const icAdmin = adminUserBuilder.build();
    const admin = adminUserBuilder.buildUser();

    beforeEach(() => {
      uow.userRepository.users = [notAdmin, admin];
    });

    it("throws if currentUser is not admin", async () => {
      await expectPromiseToFailWithError(
        getInclusionConnectedUser.execute({ userId: admin.id }, icNotAdmin),
        errors.user.forbidden({ userId: icNotAdmin.id }),
      );
    });

    it("gets another user's data if currentUser is admin", async () => {
      const fetchedUser = await getInclusionConnectedUser.execute(
        { userId: notAdmin.id },
        icAdmin,
      );
      expectToEqual(fetchedUser, {
        ...notAdmin,
        dashboards: {
          agencies: {},
          establishments: {},
        },
        agencyRights: [],
      });
    });
  });
});
