import {
  AgencyDtoBuilder,
  ConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  makeNotifyAgencyHasBeenPutOnHold,
  type NotifyAgencyHasBeenPutOnHold,
} from "./NotifyAgencyHasBeenPutOnHold";

describe("NotifyAgencyHasBeenPutOnHold", () => {
  const readOnly = new ConnectedUserBuilder()
    .withId("readOnly")
    .withEmail("readOnly")
    .buildUser();
  const counsellor = new ConnectedUserBuilder()
    .withId("counsellor")
    .withEmail("counsellor")
    .buildUser();
  const toreviewUser = new ConnectedUserBuilder()
    .withId("toreviewUser")
    .withEmail("toreviewUser")
    .buildUser();

  const agency = new AgencyDtoBuilder()
    .withAgencyContactEmail(counsellor.email)
    .build();

  let usecase: NotifyAgencyHasBeenPutOnHold;
  let uow: InMemoryUnitOfWork;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
    usecase = makeNotifyAgencyHasBeenPutOnHold({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
          new TestUuidGenerator(),
          new CustomTimeGateway(),
        ),
      },
    });
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
  });

  it("send notification", async () => {
    uow.agencyRepository.agencies = [
      toAgencyWithRights(agency, {
        [counsellor.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
        [readOnly.id]: { isNotifiedByEmail: false, roles: ["agency-viewer"] },
        [toreviewUser.id]: { isNotifiedByEmail: false, roles: ["to-review"] },
      }),
    ];

    uow.userRepository.users = [readOnly, counsellor, toreviewUser];

    await usecase.execute({ agencyId: agency.id });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "AGENCY_HAS_BEEN_PUT_ON_HOLD",
          params: { agencyName: agency.name },

          recipients: [counsellor.email, readOnly.email],
        },
      ],
    });
  });

  it("throws on missing agency", async () => {
    expectPromiseToFailWithError(
      usecase.execute({ agencyId: agency.id }),
      errors.agency.notFound({ agencyId: agency.id }),
    );
  });
});
