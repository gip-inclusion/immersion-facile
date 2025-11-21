import { addMilliseconds, subYears } from "date-fns";
import { expectToEqual, type Notification } from "shared";
import { v4 as uuid } from "uuid";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  type DeleteNotifications,
  makeDeleteNotifications,
} from "./DeleteNotifications";

describe("DeleteNotifications", () => {
  const makeNotification = (createdAt: Date): Notification => ({
    createdAt: createdAt.toISOString(),
    id: uuid(),
    kind: "email",
    followedIds: {},
    templatedContent: {
      kind: "AGENCY_WAS_REJECTED",
      params: { agencyName: "", statusJustification: "" },
      recipients: [],
    },
  });

  const timeGateway = new CustomTimeGateway(new Date());

  const twoYearsAgo = subYears(timeGateway.now(), 2);

  const notificationCreatedTwoYearsAgo: Notification =
    makeNotification(twoYearsAgo);
  const notificationCreatedAlmostTwoYearsAgo = makeNotification(
    addMilliseconds(twoYearsAgo, 1),
  );
  const notificationCreatedThrityYearsAgo = makeNotification(
    subYears(timeGateway.now(), 30),
  );

  let deleteNotifications: DeleteNotifications;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    deleteNotifications = makeDeleteNotifications({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: { timeGateway },
    });
  });

  it("do nothing when no notifications to delete", async () => {
    uow.notificationRepository.notifications = [];
    expectToEqual(await deleteNotifications.execute({ limit: 10 }), {
      deletedNotifications: 0,
    });
    expectToEqual(uow.notificationRepository.notifications, []);
  });

  it("do nothing when notifications date are less than one year", async () => {
    uow.notificationRepository.notifications = [
      notificationCreatedAlmostTwoYearsAgo,
    ];

    expectToEqual(await deleteNotifications.execute({ limit: 10 }), {
      deletedNotifications: 0,
    });

    expectToEqual(uow.notificationRepository.notifications, [
      notificationCreatedAlmostTwoYearsAgo,
    ]);
  });

  it("delete notifications when they occured at least one year ago", async () => {
    uow.notificationRepository.notifications = [
      notificationCreatedTwoYearsAgo,
      notificationCreatedThrityYearsAgo,
    ];

    expectToEqual(await deleteNotifications.execute({ limit: 10 }), {
      deletedNotifications: 2,
    });

    expectToEqual(uow.notificationRepository.notifications, []);
  });

  it("delete oldest notifications first and apply limit", async () => {
    uow.notificationRepository.notifications = [
      notificationCreatedThrityYearsAgo,
      notificationCreatedTwoYearsAgo,
    ];

    expectToEqual(await deleteNotifications.execute({ limit: 1 }), {
      deletedNotifications: 1,
    });

    expectToEqual(uow.notificationRepository.notifications, [
      notificationCreatedTwoYearsAgo,
    ]);
  });
});
