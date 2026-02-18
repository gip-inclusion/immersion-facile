import {
  AgencyDtoBuilder,
  errors,
  expectArraysToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
  UserBuilder,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import type {
  EstablishmentAdminRight,
  EstablishmentContactRight,
} from "../../establishment/entities/EstablishmentAggregate";
import { EstablishmentAggregateBuilder } from "../../establishment/helpers/EstablishmentBuilders";
import { type DeleteUser, makeDeleteUser } from "./DeleteUser";

describe("DeleteUser", () => {
  const admin1 = new UserBuilder().withId("admin1").withEmail("admin1").build();
  const admin2 = new UserBuilder().withId("admin2").withEmail("admin2").build();
  const contactMostActive = new UserBuilder()
    .withId("contactMostActive")
    .withEmail("contactMostActive")
    .build();
  const contactLessActive = new UserBuilder()
    .withId("contactLessActive")
    .withEmail("contactLessActive")
    .build();
  const admin1Right: EstablishmentAdminRight = {
    role: "establishment-admin",
    userId: admin1.id,
    isMainContactByPhone: true,
    job: "",
    phone: "",
    shouldReceiveDiscussionNotifications: true,
  };
  const admin2Right: EstablishmentAdminRight = {
    role: "establishment-admin",
    userId: admin2.id,
    isMainContactByPhone: true,
    job: "",
    phone: "",
    shouldReceiveDiscussionNotifications: true,
  };
  const contactMostActiveRight: EstablishmentContactRight = {
    userId: contactMostActive.id,
    role: "establishment-contact",
    shouldReceiveDiscussionNotifications: true,
  };
  const contactLessActiveRight: EstablishmentContactRight = {
    userId: contactLessActive.id,
    role: "establishment-contact",
    shouldReceiveDiscussionNotifications: true,
  };

  const establishment = new EstablishmentAggregateBuilder()
    .withUserRights([
      admin1Right,
      admin2Right,
      contactMostActiveRight,
      contactLessActiveRight,
    ])
    .build();
  const agency = new AgencyDtoBuilder().build();

  let deleteUser: DeleteUser;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    deleteUser = makeDeleteUser({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        timeGateway,
        createNewEvent: makeCreateNewEvent({
          timeGateway,
          uuidGenerator: new UuidV4Generator(),
        }),
      },
    });

    uow.userRepository.users = [
      admin1,
      admin2,
      contactMostActive,
      contactLessActive,
    ];
  });

  describe("right paths", () => {
    describe("User with establishment rights", () => {
      beforeEach(() => {
        uow.establishmentAggregateRepository.establishmentAggregates = [
          establishment,
        ];
      });

      it("case E1 - with contact right -> remove establishment right + event UserDeleted + user deleted", async () => {
        await deleteUser.execute({
          userId: contactMostActive.id,
          triggeredBy: { kind: "crawler" },
        });

        expectToEqual(uow.userRepository.users, [
          admin1,
          admin2,
          contactLessActive,
        ]);
        expectToEqual(
          uow.establishmentAggregateRepository.establishmentAggregates,
          [
            new EstablishmentAggregateBuilder(establishment)
              .withEstablishmentUpdatedAt(timeGateway.now())
              .withUserRights([
                admin1Right,
                admin2Right,
                contactLessActiveRight,
              ])
              .build(),
          ],
        );
        expectArraysToMatch(uow.outboxRepository.events, [
          {
            topic: "UserDeleted",
            payload: {
              triggeredBy: { kind: "crawler" },
              userId: contactMostActive.id,
            },
          },
        ]);
      });

      it("case E2 - with admin right and another user with not admin right -> remove establishment right + event UserDeleted + user deleted + most active remaining user with admin right", async () => {
        uow.establishmentAggregateRepository.establishmentAggregates = [
          new EstablishmentAggregateBuilder(establishment)
            .withUserRights([
              admin1Right,
              contactMostActiveRight,
              contactLessActiveRight,
            ])
            .build(),
        ];

        await deleteUser.execute({
          userId: admin1.id,
          triggeredBy: { kind: "crawler" },
        });

        expectToEqual(uow.userRepository.users, [
          admin2,
          contactMostActive,
          contactLessActive,
        ]);
        expectToEqual(
          uow.establishmentAggregateRepository.establishmentAggregates,
          [
            new EstablishmentAggregateBuilder(establishment)
              .withEstablishmentUpdatedAt(timeGateway.now())
              .withUserRights([
                {
                  userId: contactMostActive.id,
                  role: "establishment-admin",
                  shouldReceiveDiscussionNotifications: true,
                  isMainContactByPhone: null,
                  job: "non-communiqué", // comment on défini le job si on ne le connait pas ?
                  phone: "+33600000000", // comment on défini le phone si on ne le connait pas ?
                },
                contactLessActiveRight,
              ])
              .build(),
          ],
        );
        expectArraysToMatch(uow.outboxRepository.events, [
          { topic: "UserDeleted" },
        ]);
      });

      it("case E2 bis - user with admin right and another user with admin right -> remove establishment right + event UserDeleted + user deleted ", async () => {
        await deleteUser.execute({
          userId: admin1.id,
          triggeredBy: { kind: "crawler" },
        });

        expectToEqual(uow.userRepository.users, [
          admin2,
          contactMostActive,
          contactLessActive,
        ]);
        expectToEqual(
          uow.establishmentAggregateRepository.establishmentAggregates,
          [
            new EstablishmentAggregateBuilder(establishment)
              .withEstablishmentUpdatedAt(timeGateway.now())
              .withUserRights([
                admin2Right,
                contactMostActiveRight,
                contactLessActiveRight,
              ])
              .build(),
          ],
        );
        expectArraysToMatch(uow.outboxRepository.events, [
          {
            topic: "UserDeleted",
            payload: { triggeredBy: { kind: "crawler" }, userId: admin1.id },
          },
        ]);
      });

      it("case E3 - User with admin right and no other user have right on establishment -> remove establishment right + event UserDeleted + event EstablishmentDeletionTriggered + user deleted ", async () => {
        uow.establishmentAggregateRepository.establishmentAggregates = [
          new EstablishmentAggregateBuilder(establishment)
            .withUserRights([admin1Right])
            .build(),
        ];

        await deleteUser.execute({
          userId: admin1.id,
          triggeredBy: { kind: "crawler" },
        });

        expectToEqual(uow.userRepository.users, [
          admin2,
          contactMostActive,
          contactLessActive,
        ]);
        expectToEqual(
          uow.establishmentAggregateRepository.establishmentAggregates,
          [
            {
              ...new EstablishmentAggregateBuilder(establishment)
                .withEstablishmentUpdatedAt(timeGateway.now())
                .build(),
              userRights: [],
            },
          ],
        );
        expectArraysToMatch(uow.outboxRepository.events, [
          {
            topic: "UserDeleted",
            payload: { triggeredBy: { kind: "crawler" }, userId: admin1.id },
          },
          {
            topic: "AllEstablishmentUsersDeleted",
            payload: {
              siret: establishment.establishment.siret,
              triggeredBy: { kind: "crawler" },
            },
          },
        ]);
      });
    });

    describe("User with agency rights", () => {
      beforeEach(() => {
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [admin1.id]: { isNotifiedByEmail: false, roles: ["agency-admin"] },
          }),
        ];
      });

      it("TEMPORARY behavior - throws forbidden when user to delete have agency rights", () => {
        expectPromiseToFailWithError(
          deleteUser.execute({
            userId: admin1.id,
            triggeredBy: { kind: "crawler" },
          }),
          errors.user.deleteForbiddenAgencyRights(admin1.id),
        );
      });
    });
  });

  describe("wrong paths", () => {
    it("missing user", async () => {
      uow.userRepository.users = [];

      expectPromiseToFailWithError(
        deleteUser.execute({
          userId: admin1.id,
          triggeredBy: { kind: "crawler" },
        }),
        errors.user.notFound({ userId: admin1.id }),
      );
    });

    it("forbidden, not triggered by crawler", async () => {
      expectPromiseToFailWithError(
        deleteUser.execute({
          userId: admin1.id,
          triggeredBy: { kind: "connected-user", userId: "osef" },
        }),
        errors.user.forbiddenNotTriggeredByCrawler(),
      );
    });
  });
});
