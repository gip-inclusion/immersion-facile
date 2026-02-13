import {
  errors,
  expectArraysToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
  UserBuilder,
} from "shared";
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
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];
  });

  describe("right paths", () => {
    it("cas E1 - Utilisateur avec droit contact sur entreprise -> retirer le droit entreprise + event UserDeleted + suppression utilisateur", async () => {
      await deleteUser.execute({ userId: contactMostActive.id });

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
            .withUserRights([admin1Right, admin2Right, contactLessActiveRight])
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

    it("cas E2 bis - Utilisateur avec droit admin sur entreprise + autre utilisateur admin -> retirer le droit entreprise + event UserDeleted + suppression utilisateur ", async () => {
      await deleteUser.execute({ userId: admin1.id });

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

    it("cas E2 - Utilisateur avec droit admin sur entreprise + autre utilisateur non admin -> retirer le droit entreprise + event UserDeleted + suppression utilisateur + affecter droit admins sur utilisateur non admin ne plus actif", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        new EstablishmentAggregateBuilder(establishment)
          .withUserRights([
            admin1Right,
            contactMostActiveRight,
            contactLessActiveRight,
          ])
          .build(),
      ];

      await deleteUser.execute({ userId: admin1.id });

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
  });

  describe("wrong paths", () => {
    it("missing user", async () => {
      uow.userRepository.users = [];

      expectPromiseToFailWithError(
        deleteUser.execute({ userId: contactMostActive.id }),
        errors.user.notFound({ userId: contactMostActive.id }),
      );
    });
  });
});
