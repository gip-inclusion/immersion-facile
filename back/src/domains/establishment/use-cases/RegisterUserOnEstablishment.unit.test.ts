import {
  ConnectedUserBuilder,
  errors,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
  type FormEstablishmentUserRight,
  UserBuilder,
} from "shared";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { EstablishmentAggregateBuilder } from "../helpers/EstablishmentBuilders";
import {
  makeRegisterUserOnEstablishment,
  type RegisterUserOnEstablishment,
} from "./RegisterUserOnEstablishment";

describe("RegisterUserOnEstablishment", () => {
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;
  let registerUserOnEstablishment: RegisterUserOnEstablishment;

  const anyConnectedUser = new ConnectedUserBuilder().build();

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    registerUserOnEstablishment = makeRegisterUserOnEstablishment({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        timeGateway,
        createNewEvent: makeCreateNewEvent({
          timeGateway,
          uuidGenerator: new TestUuidGenerator(),
        }),
      },
    });
  });

  describe("Wrong path", () => {
    it("fails if no current user", async () => {
      await expectPromiseToFailWithError(
        registerUserOnEstablishment.execute(
          {
            siret: "12345678901234",
            userRight: {
              email: "test@test.com",
              role: "establishment-contact",
              status: "ACCEPTED",
              shouldReceiveDiscussionNotifications: true,
              isMainContactByPhone: false,
            },
          },
          undefined,
        ),
        errors.user.unauthorized(),
      );
    });

    it("fails if current user email does not match user right email", async () => {
      await expectPromiseToFailWithError(
        registerUserOnEstablishment.execute(
          {
            siret: "12345678901234",
            userRight: {
              email: "test@test.com",
              role: "establishment-contact",
              status: "ACCEPTED",
              shouldReceiveDiscussionNotifications: true,
              isMainContactByPhone: false,
            },
          },
          anyConnectedUser,
        ),
        errors.user.forbiddenEmailUpdate(),
      );
    });

    it("fails if user right status is not pending", async () => {
      await expectPromiseToFailWithError(
        registerUserOnEstablishment.execute(
          {
            siret: "12345678901234",
            userRight: {
              email: "test@test.com",
              role: "establishment-contact",
              status: "ACCEPTED",
              shouldReceiveDiscussionNotifications: true,
              isMainContactByPhone: false,
            },
          },
          anyConnectedUser,
        ),
        errors.establishment.userRightStatusNotPending({
          siret: "12345678901234",
          userId: anyConnectedUser.id,
        }),
      );
    });

    it("fails if no establishment with this siret", async () => {
      uow.userRepository.users = [anyConnectedUser];

      await expectPromiseToFailWithError(
        registerUserOnEstablishment.execute(
          {
            siret: "12345678901234",
            userRight: {
              email: "test@test.com",
              role: "establishment-contact",
              status: "PENDING",
              shouldReceiveDiscussionNotifications: true,
              isMainContactByPhone: false,
            },
          },
          anyConnectedUser,
        ),
        errors.establishment.notFound({ siret: "12345678901234" }),
      );
    });
    it("fails if user already has already a right on this establishment", async () => {
      uow.userRepository.users = [anyConnectedUser];
      const establishmentAggregate = new EstablishmentAggregateBuilder()
        .withUserRights([
          {
            userId: anyConnectedUser.id,
            role: "establishment-contact",
            status: "PENDING",
            shouldReceiveDiscussionNotifications: true,
            isMainContactByPhone: false,
          },
        ])
        .build();
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentAggregate,
      ];
      await expectPromiseToFailWithError(
        registerUserOnEstablishment.execute(
          {
            siret: establishmentAggregate.establishment.siret,
            userRight: {
              email: "test@test.com",
              role: "establishment-contact",
              status: "PENDING",
              shouldReceiveDiscussionNotifications: true,
              isMainContactByPhone: false,
            },
          },
          anyConnectedUser,
        ),
        errors.establishment.userRightAlreadyExists({
          siret: establishmentAggregate.establishment.siret,
          userId: anyConnectedUser.id,
        }),
      );
    });
  });

  describe("Right path", () => {
    const adminEstablishmentUser = new UserBuilder()
      .withId("adminEstablishmentUser")
      .build();
    const establishmentAggregate = new EstablishmentAggregateBuilder()
      .withUserRights([
        {
          userId: adminEstablishmentUser.id,
          role: "establishment-admin",
          status: "ACCEPTED",
          shouldReceiveDiscussionNotifications: true,
          isMainContactByPhone: false,
          job: "osef",
          phone: "osef",
        },
      ])
      .build();

    it("registers user on establishment", async () => {
      const userRightWithRequestedRole: FormEstablishmentUserRight = {
        email: "test@test.com",
        role: "establishment-contact",
        status: "PENDING",
        shouldReceiveDiscussionNotifications: true,
        isMainContactByPhone: false,
      };

      uow.userRepository.users = [anyConnectedUser];
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentAggregate,
      ];

      const result = await registerUserOnEstablishment.execute(
        {
          siret: establishmentAggregate.establishment.siret,
          userRight: userRightWithRequestedRole,
        },
        anyConnectedUser,
      );

      expectToEqual(result, undefined);
      expectToEqual(
        await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
          establishmentAggregate.establishment.siret,
        ),
        {
          ...establishmentAggregate,
          userRights: [
            ...establishmentAggregate.userRights,
            { ...userRightWithRequestedRole, userId: anyConnectedUser.id },
          ],
          establishment: {
            ...establishmentAggregate.establishment,
            updatedAt: timeGateway.now(),
          },
        },
      );

      expect(uow.outboxRepository.events).toHaveLength(1);
      expectObjectsToMatch(uow.outboxRepository.events[0], {
        topic: "PendingUserRightRegisteredOnEstablishment",
        payload: {
          siret: establishmentAggregate.establishment.siret,
          userRight: {
            userId: anyConnectedUser.id,
            role: "establishment-contact",
            status: "PENDING",
            shouldReceiveDiscussionNotifications: true,
            isMainContactByPhone: false,
          },
          triggeredBy: {
            kind: "connected-user",
            userId: anyConnectedUser.id,
          },
        },
      });
    });
  });
});
