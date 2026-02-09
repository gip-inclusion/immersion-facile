import { subDays, subYears } from "date-fns";
import {
  ConnectedUserBuilder,
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
});
