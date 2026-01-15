import {
  AgencyDtoBuilder,
  BadRequestError,
  type ConnectedUser,
  ConnectedUserBuilder,
  type DelegationAgencyInfo,
  errors,
  expectArraysToMatch,
  expectPromiseToFail,
  expectPromiseToFailWithError,
  expectToEqual,
  toAgencyDtoForAgencyUsersAndAdmins,
  type UserWithAdminRights,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { makeUpdateAgency, type UpdateAgency } from "./UpdateAgency";

describe("Update agency", () => {
  const initialAgencyInRepo = new AgencyDtoBuilder().build();
  const adminBuilder = new ConnectedUserBuilder()
    .withId("backoffice-admin-id")
    .withIsAdmin(true);

  const admin = adminBuilder.buildUser();
  const connectedAdmin = adminBuilder.build();

  const notAdminBuilder = new ConnectedUserBuilder()
    .withId("not-admin-id")
    .withIsAdmin(false);
  const notAdmin = notAdminBuilder.buildUser();
  const connectedNotAdmin = notAdminBuilder.build();

  const agencyAdminBuilder = new ConnectedUserBuilder()
    .withId("agency-admin-id")
    .withIsAdmin(false);
  const agencyAdmin = agencyAdminBuilder.buildUser();
  const connectedAgencyAdmin = agencyAdminBuilder
    .withAgencyRights([
      {
        agency: toAgencyDtoForAgencyUsersAndAdmins(initialAgencyInRepo, []),
        roles: ["agency-admin"],
        isNotifiedByEmail: true,
      },
    ])
    .build();

  let uow: InMemoryUnitOfWork;
  let updateAgency: UpdateAgency;

  beforeEach(() => {
    uow = createInMemoryUow();
    uow.userRepository.users = [admin, notAdmin];
    updateAgency = makeUpdateAgency({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        createNewEvent: makeCreateNewEvent({
          timeGateway: new CustomTimeGateway(),
          uuidGenerator: new TestUuidGenerator(),
        }),
      },
    });
  });

  describe("Wrong path", () => {
    it("throws Forbidden if current user is not admin nore agency admin on agency", async () => {
      const agency = new AgencyDtoBuilder().build();
      await expectPromiseToFailWithError(
        updateAgency.execute(
          { ...agency, validatorEmails: ["mail@mail.com"] },
          connectedNotAdmin,
        ),
        errors.user.forbidden({ userId: notAdmin.id }),
      );
    });

    it("Fails trying to update if no matching agency was found", async () => {
      const agency = new AgencyDtoBuilder().build();
      await expectPromiseToFailWithError(
        updateAgency.execute(
          { ...agency, validatorEmails: ["mail@mail.com"] },
          connectedAdmin,
        ),
        errors.agency.notFound({ agencyId: agency.id }),
      );
    });

    it("Fails to update agency if address components are empty", async () => {
      uow.agencyRepository.agencies = [
        toAgencyWithRights(initialAgencyInRepo, {}),
      ];
      const updatedAgency = new AgencyDtoBuilder()
        .withId(initialAgencyInRepo.id)
        .withName("L'agence modifié")
        .withAddress({
          streetNumberAndAddress: "",
          postcode: "",
          city: "",
          departmentCode: "",
        })
        .build();
      await expectPromiseToFail(
        updateAgency.execute(
          { ...updatedAgency, validatorEmails: ["new-validator@mail.com"] },
          connectedAdmin,
        ),
      );
    });

    it("Fails to update agency if geo components are 0,0", async () => {
      const initialAgencyInRepo = new AgencyDtoBuilder().build();
      uow.agencyRepository.agencies = [
        toAgencyWithRights(initialAgencyInRepo, {}),
      ];
      const updatedAgency = new AgencyDtoBuilder()
        .withId(initialAgencyInRepo.id)
        .withName("L'agence modifié")
        .withPosition(0, 0)
        .build();

      await expectPromiseToFailWithError(
        updateAgency.execute(
          { ...updatedAgency, validatorEmails: ["new-validator@mail.com"] },
          connectedAdmin,
        ),
        new BadRequestError(
          `Schema validation failed in usecase UpdateAgency for element with id ${updatedAgency.id}. See issues for details.`,
          [
            "position.lat : 0 est une latitude par défaut qui ne semble pas correcte",
            "position.lon : 0 est une longitude par défaut qui ne semble pas correcte",
          ],
        ),
      );
    });
  });

  it.each([
    {
      triggeredByRole: "backoffice-admin",
      triggeredByUser: connectedAdmin,
      initialUsers: [admin, notAdmin],
    },
    {
      triggeredByRole: "agency-admin",
      triggeredByUser: connectedAgencyAdmin,
      initialUsers: [agencyAdmin],
    },
  ] satisfies {
    triggeredByRole: string;
    triggeredByUser: ConnectedUser;
    initialUsers: UserWithAdminRights[];
  }[])("$triggeredByRole can update agency without changes on user rights and create corresponding event", async ({
    initialUsers,
    triggeredByUser,
  }) => {
    uow.userRepository.users = initialUsers;
    uow.agencyRepository.agencies = [
      toAgencyWithRights(initialAgencyInRepo, {}),
    ];

    const updatedAgency = new AgencyDtoBuilder(initialAgencyInRepo)
      .withName("L'agence modifié")
      .build();

    await updateAgency.execute(
      { ...updatedAgency, validatorEmails: ["new-validator@mail.com"] },
      triggeredByUser,
    );

    expectToEqual(uow.agencyRepository.agencies, [
      toAgencyWithRights(
        new AgencyDtoBuilder(initialAgencyInRepo)
          .withName("L'agence modifié")
          .build(),
        {},
      ),
    ]);
    expectToEqual(uow.userRepository.users, initialUsers);
    expectArraysToMatch(uow.outboxRepository.events, [
      {
        topic: "AgencyUpdated",
        payload: {
          agencyId: updatedAgency.id,
          triggeredBy: {
            kind: "connected-user",
            userId: triggeredByUser.id,
          },
        },
      },
    ]);
  });

  it("updates agency with delegationAgencyInfo", async () => {
    const agencyWithDelegation = new AgencyDtoBuilder()
      .withId("agency-with-delegation")
      .withName("Agency with delegation")
      .withKind("autre")
      .withDelegationAgencyInfo({
        delegationEndDate: new Date("2029-01-01").toISOString(),
        delegationAgencyName: "France Travail",
        delegationAgencyKind: "pole-emploi",
      })
      .build();

    uow.agencyRepository.agencies = [
      toAgencyWithRights(agencyWithDelegation, {}),
    ];

    const updatedDelegationInfo: DelegationAgencyInfo = {
      delegationEndDate: new Date("2030-06-15").toISOString(),
      delegationAgencyName: "Mission Locale",
      delegationAgencyKind: "mission-locale",
    };

    const updatedAgency = new AgencyDtoBuilder(agencyWithDelegation)
      .withDelegationAgencyInfo(updatedDelegationInfo)
      .build();

    await updateAgency.execute(
      { ...updatedAgency, validatorEmails: ["validator@mail.com"] },
      connectedAdmin,
    );

    expectToEqual(uow.agencyRepository.agencies, [
      toAgencyWithRights(updatedAgency, {}),
    ]);
  });
});
