import {
  AgencyDtoBuilder,
  InclusionConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { SendEmailWhenAgencyIsRejected } from "./SendEmailWhenAgencyIsRejected";

describe("SendEmailWhenAgencyIsRejected", () => {
  const agency = AgencyDtoBuilder.create()
    .withName("just-rejected-agency")
    .withLogoUrl("https://logo.com")
    .withStatus("rejected")
    .withRejectionJustification("rejection justification")
    .build();
  const validator = new InclusionConnectedUserBuilder()
    .withId("validator")
    .withEmail("validator@email.com")
    .build();

  let uow: InMemoryUnitOfWork;
  let useCase: SendEmailWhenAgencyIsRejected;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    useCase = new SendEmailWhenAgencyIsRejected(
      new InMemoryUowPerformer(uow),
      makeSaveNotificationAndRelatedEvent(
        new UuidV4Generator(),
        new CustomTimeGateway(),
      ),
    );
  });

  it("Sends an email to validators with agency name", async () => {
    // Prepare
    uow.agencyRepository.agencies = [
      toAgencyWithRights(agency, {
        [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    ];
    uow.userRepository.users = [validator];

    // Act
    await useCase.execute({ agencyId: agency.id });

    // Assert
    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "AGENCY_WAS_REJECTED",
          recipients: [validator.email],
          params: {
            agencyName: agency.name,
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            rejectionJustification: agency.rejectionJustification!,
          },
        },
      ],
    });
  });

  it("On missing agency", async () => {
    // Prepare
    uow.agencyRepository.agencies = [];
    uow.userRepository.users = [validator];

    // Act
    await expectPromiseToFailWithError(
      useCase.execute({ agencyId: agency.id }),
      errors.agency.notFound({ agencyId: agency.id }),
    );

    // Assert
    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });

  it("On agency not rejected", async () => {
    // Prepare
    uow.agencyRepository.agencies = [
      toAgencyWithRights(
        new AgencyDtoBuilder(agency).withRejectionJustification(null).build(),
        {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        },
      ),
    ];
    uow.userRepository.users = [validator];

    // Act
    await expectPromiseToFailWithError(
      useCase.execute({ agencyId: agency.id }),
      errors.agency.notRejected({ agencyId: agency.id }),
    );

    // Assert
    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });
});
