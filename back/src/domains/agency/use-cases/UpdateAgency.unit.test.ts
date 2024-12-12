import {
  AgencyDtoBuilder,
  BadRequestError,
  InclusionConnectedUser,
  InclusionConnectedUserBuilder,
  UserWithAdminRights,
  errors,
  expectArraysToMatch,
  expectPromiseToFail,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { UpdateAgency } from "./UpdateAgency";

describe("Update agency", () => {
  const initialAgencyInRepo = new AgencyDtoBuilder().build();
  const adminBuilder = new InclusionConnectedUserBuilder()
    .withId("backoffice-admin-id")
    .withIsAdmin(true);

  const admin = adminBuilder.buildUser();
  const icAdmin = adminBuilder.build();

  const notAdminBuilder = new InclusionConnectedUserBuilder()
    .withId("not-admin-id")
    .withIsAdmin(false);
  const notAdmin = notAdminBuilder.buildUser();
  const icNotAdmin = notAdminBuilder.build();

  const agencyAdminBuilder = new InclusionConnectedUserBuilder()
    .withId("agency-admin-id")
    .withIsAdmin(false);
  const agencyAdmin = agencyAdminBuilder.buildUser();
  const icAgencyAdmin = agencyAdminBuilder
    .withAgencyRights([
      {
        agency: initialAgencyInRepo,
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
    updateAgency = new UpdateAgency(
      new InMemoryUowPerformer(uow),
      makeCreateNewEvent({
        timeGateway: new CustomTimeGateway(),
        uuidGenerator: new TestUuidGenerator(),
      }),
    );
  });

  describe("Wrong path", () => {
    it("throws Unauthorized if no current user", async () => {
      const agency = new AgencyDtoBuilder().build();
      await expectPromiseToFailWithError(
        updateAgency.execute({ ...agency, validatorEmails: ["mail@mail.com"] }),
        errors.user.unauthorized(),
      );
    });

    it("throws Forbidden if current user is not admin nore agency admin on agency", async () => {
      const agency = new AgencyDtoBuilder().build();
      await expectPromiseToFailWithError(
        updateAgency.execute(
          { ...agency, validatorEmails: ["mail@mail.com"] },
          icNotAdmin,
        ),
        errors.user.forbidden({ userId: notAdmin.id }),
      );
    });

    it("Fails trying to update if no matching agency was found", async () => {
      const agency = new AgencyDtoBuilder().build();
      await expectPromiseToFailWithError(
        updateAgency.execute(
          { ...agency, validatorEmails: ["mail@mail.com"] },
          icAdmin,
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
          icAdmin,
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
          icAdmin,
        ),
        new BadRequestError(
          "Schema validation failed. See issues for details.",
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
      triggeredByUser: icAdmin,
      initialUsers: [admin, notAdmin],
    },
    {
      triggeredByRole: "agency-admin",
      triggeredByUser: icAgencyAdmin,
      initialUsers: [agencyAdmin],
    },
  ] satisfies {
    triggeredByRole: string;
    triggeredByUser: InclusionConnectedUser;
    initialUsers: UserWithAdminRights[];
  }[])(
    "$triggeredByRole can update agency without changes on user rights and create corresponding event",
    async ({ initialUsers, triggeredByUser }) => {
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
              kind: "inclusion-connected",
              userId: triggeredByUser.id,
            },
          },
        },
      ]);
    },
  );
});
