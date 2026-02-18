import { addDays, subDays, subMonths, subYears } from "date-fns";
import {
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  DiscussionBuilder,
  expectToEqual,
  type UserWithAdminRights,
} from "shared";
import { makeCreateNewEvent } from "../../../events/ports/EventBus";
import { CustomTimeGateway } from "../../../time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  makeTriggerEventsToDeleteInactiveUsers,
  type TriggerEventsToDeleteInactiveUsers,
} from "./TriggerEventsToDeleteInactiveUsers";

const now = new Date("2026-01-15T10:00:00.000Z");

const makeUser = (
  overrides: Partial<UserWithAdminRights> & { id: string; email: string },
): UserWithAdminRights => ({
  ...new ConnectedUserBuilder()
    .withId(overrides.id)
    .withEmail(overrides.email)
    .withFirstName(overrides.firstName ?? "Jean")
    .withLastName(overrides.lastName ?? "Dupont")
    .buildUser(),
  lastLoginAt: overrides.lastLoginAt,
});

describe("TriggerEventsToDeleteInactiveUsers", () => {
  let uow: InMemoryUnitOfWork;
  let triggerEventsToDeleteInactiveUsers: TriggerEventsToDeleteInactiveUsers;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    timeGateway.setNextDate(now);

    const uuidGenerator = new UuidV4Generator();
    const createNewEvent = makeCreateNewEvent({
      timeGateway,
      uuidGenerator,
    });

    triggerEventsToDeleteInactiveUsers = makeTriggerEventsToDeleteInactiveUsers(
      {
        uowPerformer: new InMemoryUowPerformer(uow),
        deps: {
          timeGateway,
          createNewEvent,
        },
      },
    );
  });

  it("saves an InactiveUserAccountDeletionTriggered event for each inactive user to delete", async () => {
    const inactiveUser = makeUser({
      id: "inactive-id",
      email: "inactive@test.fr",
      lastLoginAt: subDays(subYears(now, 2), 1).toISOString(),
    });
    uow.userRepository.users = [inactiveUser];

    const result = await triggerEventsToDeleteInactiveUsers.execute();

    expectToEqual(result, { numberOfDeletionsTriggered: 1 });
    expectToEqual(uow.outboxRepository.events.length, 1);
    expectToEqual(
      uow.outboxRepository.events[0].topic,
      "InactiveUserAccountDeletionTriggered",
    );
    expectToEqual(uow.outboxRepository.events[0].payload, {
      userId: inactiveUser.id,
    });
  });

  it("returns 0 and saves no events when no users to delete", async () => {
    uow.userRepository.users = [];

    const result = await triggerEventsToDeleteInactiveUsers.execute();

    expectToEqual(result, { numberOfDeletionsTriggered: 0 });
    expectToEqual(uow.outboxRepository.events.length, 0);
  });

  it("does not trigger deletion for user with convention ending within 2-year window (future or 23 months ago)", async () => {
    const twoYearsAgo = subYears(now, 2);
    const userWithFutureConvention = makeUser({
      id: "future-convention-id",
      email: "future-convention@test.fr",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });
    const userWith23MonthOldConvention = makeUser({
      id: "recent-convention-id",
      email: "recent-convention@test.fr",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });
    uow.userRepository.users = [
      userWithFutureConvention,
      userWith23MonthOldConvention,
    ];

    uow.conventionRepository.setConventions([
      new ConventionDtoBuilder()
        .withId("convention-future")
        .withBeneficiaryEmail(userWithFutureConvention.email)
        .withDateEnd(addDays(now, 30).toISOString())
        .build(),
      new ConventionDtoBuilder()
        .withId("convention-23m")
        .withBeneficiaryEmail(userWith23MonthOldConvention.email)
        .withDateEnd(subMonths(now, 23).toISOString())
        .build(),
    ]);

    const result = await triggerEventsToDeleteInactiveUsers.execute();

    expectToEqual(result, { numberOfDeletionsTriggered: 0 });
    expectToEqual(uow.outboxRepository.events.length, 0);
  });

  it("does not trigger deletion for user with exchange within 2-year window (30 days ago or 23 months ago)", async () => {
    const twoYearsAgo = subYears(now, 2);
    const userWithRecentExchange = makeUser({
      id: "recent-exchange-id",
      email: "recent-exchange@test.fr",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });
    const userWith23MonthOldExchange = makeUser({
      id: "old-exchange-id",
      email: "old-exchange@test.fr",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });
    uow.userRepository.users = [
      userWithRecentExchange,
      userWith23MonthOldExchange,
    ];

    uow.discussionRepository.discussions = [
      new DiscussionBuilder()
        .withId("discussion-recent")
        .withPotentialBeneficiaryEmail(userWithRecentExchange.email)
        .withExchanges([
          {
            subject: "Test",
            message: "Hello",
            sentAt: subDays(now, 30).toISOString(),
            sender: "potentialBeneficiary",
            attachments: [],
          },
        ])
        .build(),
      new DiscussionBuilder()
        .withId("discussion-23m")
        .withPotentialBeneficiaryEmail(userWith23MonthOldExchange.email)
        .withExchanges([
          {
            subject: "Recent enough",
            message: "Hello",
            sentAt: subMonths(now, 23).toISOString(),
            sender: "potentialBeneficiary",
            attachments: [],
          },
        ])
        .build(),
    ];

    const result = await triggerEventsToDeleteInactiveUsers.execute();

    expectToEqual(result, { numberOfDeletionsTriggered: 0 });
    expectToEqual(uow.outboxRepository.events.length, 0);
  });

  it("triggers deletion for user with expired convention and old discussion", async () => {
    const twoYearsAgo = subYears(now, 2);
    const inactiveUser = makeUser({
      id: "inactive-id",
      email: "inactive@test.fr",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });
    uow.userRepository.users = [inactiveUser];

    const oldConvention = new ConventionDtoBuilder()
      .withId("old-convention-1")
      .withBeneficiaryEmail(inactiveUser.email)
      .withDateEnd(subDays(twoYearsAgo, 10).toISOString())
      .build();
    uow.conventionRepository.setConventions([oldConvention]);

    const oldDiscussion = new DiscussionBuilder()
      .withId("old-discussion-1")
      .withPotentialBeneficiaryEmail(inactiveUser.email)
      .withExchanges([
        {
          subject: "Old",
          message: "Old exchange",
          sentAt: subDays(twoYearsAgo, 10).toISOString(),
          sender: "potentialBeneficiary",
          attachments: [],
        },
      ])
      .build();
    uow.discussionRepository.discussions = [oldDiscussion];

    const result = await triggerEventsToDeleteInactiveUsers.execute();

    expectToEqual(result, { numberOfDeletionsTriggered: 1 });
    expectToEqual(uow.outboxRepository.events.length, 1);
    expectToEqual(
      uow.outboxRepository.events[0].topic,
      "InactiveUserAccountDeletionTriggered",
    );
    expectToEqual(uow.outboxRepository.events[0].payload, {
      userId: inactiveUser.id,
    });
  });
});
