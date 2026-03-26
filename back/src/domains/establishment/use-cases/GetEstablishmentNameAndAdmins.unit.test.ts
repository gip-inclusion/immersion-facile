import {
  type ConnectedUser,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  noAgencyDashboards,
  noEstablishmentDashboard,
  UserBuilder,
} from "shared";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { EstablishmentAggregateBuilder } from "../helpers/EstablishmentBuilders";
import {
  type GetEstablishmentNameAndAdmins,
  makeGetEstablishmentNameAndAdmins,
} from "./GetEstablishmentNameAndAdmins";

describe("GetEstablishmentNameAndAdmins", () => {
  const userWithoutEstablishmentRight = new UserBuilder().withId("1").build();
  const establishmentAdminUser = new UserBuilder()
    .withId("2")
    .withEmail("admin@corp.com")
    .build();
  const establishmentContactUser = new UserBuilder()
    .withId("3")
    .withEmail("contact@corp.com")
    .build();
  const establishment = new EstablishmentAggregateBuilder()
    .withUserRights([
      {
        role: "establishment-admin",
        status: "ACCEPTED",
        userId: establishmentAdminUser.id,
        job: "osef",
        phone: "osef",
        shouldReceiveDiscussionNotifications: true,
        isMainContactByPhone: false,
      },
      {
        role: "establishment-contact",
        status: "ACCEPTED",
        userId: establishmentContactUser.id,
        job: "osef",
        phone: "osef",
        shouldReceiveDiscussionNotifications: true,
      },
    ])
    .build();

  let getEstablishmentNameAndAdmins: GetEstablishmentNameAndAdmins;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    getEstablishmentNameAndAdmins = makeGetEstablishmentNameAndAdmins({
      uowPerformer: new InMemoryUowPerformer(uow),
    });

    uow.userRepository.users = [
      userWithoutEstablishmentRight,
      establishmentAdminUser,
      establishmentContactUser,
    ];
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];
  });

  it("", () => {
    // Delete usecase because unused from front to back
    expect(true).toBe(false);
  });
  describe("right paths", () => {
    describe("allow get establishment name and admins", () => {
      it.each([
        {
          name: "when user have establishment rights",
          currentUser: {
            ...establishmentContactUser,
            establishments: [
              {
                role: "establishment-contact",
                siret: establishment.establishment.siret,
                businessName: establishment.establishment.name,
                status: "ACCEPTED",
                admins: [],
              },
            ],
            agencyRights: [],
            dashboards: {
              agencies: noAgencyDashboards,
              establishments: noEstablishmentDashboard,
            },
          },
        },
        {
          name: "when user has proConnect Siret matching establishment Siret",
          currentUser: {
            ...userWithoutEstablishmentRight,
            proConnect: {
              externalId: "osef",
              siret: establishment.establishment.siret,
            },
            agencyRights: [],
            dashboards: {
              agencies: noAgencyDashboards,
              establishments: noEstablishmentDashboard,
            },
          },
        },
        {
          name: "when user is backoffice admin",
          currentUser: {
            ...userWithoutEstablishmentRight,
            isBackofficeAdmin: true,
            agencyRights: [],
            dashboards: {
              agencies: noAgencyDashboards,
              establishments: noEstablishmentDashboard,
            },
          },
        },
      ] satisfies {
        name: string;
        currentUser: ConnectedUser;
      }[])("$name", async ({ currentUser }) => {
        expectToEqual(
          await getEstablishmentNameAndAdmins.execute(
            { siret: establishment.establishment.siret },
            currentUser,
          ),
          {
            name: establishment.establishment.name,
            adminEmails: [establishmentAdminUser.email],
          },
        );
      });
    });

    it("With establishment custom name if provided", async () => {
      const establishmentWithCustomizedName = new EstablishmentAggregateBuilder(
        establishment,
      )
        .withEstablishmentCustomizedName("Special Sauce!")
        .build();

      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentWithCustomizedName,
      ];

      const currentConnectedUser: ConnectedUser = {
        ...userWithoutEstablishmentRight,
        proConnect: {
          externalId: "osef",
          siret: establishmentWithCustomizedName.establishment.siret,
        },
        agencyRights: [],
        dashboards: {
          agencies: noAgencyDashboards,
          establishments: noEstablishmentDashboard,
        },
      };

      expectToEqual(
        await getEstablishmentNameAndAdmins.execute(
          { siret: establishmentWithCustomizedName.establishment.siret },
          currentConnectedUser,
        ),
        {
          name: establishmentWithCustomizedName.establishment.customizedName,
          adminEmails: [establishmentAdminUser.email],
        },
      );
    });
  });

  describe("wrong paths", () => {
    // Establishment missing
    // User not allowed
    // User missing

    it("when Establishment missing", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [];

      await expectPromiseToFailWithError(
        getEstablishmentNameAndAdmins.execute(
          { siret: establishment.establishment.siret },
          {
            ...userWithoutEstablishmentRight,
            isBackofficeAdmin: true,
            agencyRights: [],
            dashboards: {
              agencies: noAgencyDashboards,
              establishments: noEstablishmentDashboard,
            },
          },
        ),
        errors.establishment.notFound({
          siret: establishment.establishment.siret,
        }),
      );
    });

    it("when user is not allowed", async () => {
      await expectPromiseToFailWithError(
        getEstablishmentNameAndAdmins.execute(
          { siret: establishment.establishment.siret },
          {
            ...userWithoutEstablishmentRight,
            agencyRights: [],
            dashboards: {
              agencies: noAgencyDashboards,
              establishments: noEstablishmentDashboard,
            },
          },
        ),
        errors.user.forbidden({
          userId: userWithoutEstablishmentRight.id,
        }),
      );
    });

    it("when user is missing", async () => {
      uow.userRepository.users = [];

      await expectPromiseToFailWithError(
        getEstablishmentNameAndAdmins.execute(
          { siret: establishment.establishment.siret },
          {
            ...userWithoutEstablishmentRight,
            isBackofficeAdmin: true,
            agencyRights: [],
            dashboards: {
              agencies: noAgencyDashboards,
              establishments: noEstablishmentDashboard,
            },
          },
        ),
        errors.users.notFound({
          userIds: [establishmentAdminUser.id],
        }),
      );
    });
  });
});
