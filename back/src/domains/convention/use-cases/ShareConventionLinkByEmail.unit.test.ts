import { afterEach } from "node:test";
import {
  type InternshipKind,
  errors,
  expectObjectInArrayToMatch,
  expectPromiseToFailWithError,
} from "shared";
import { AppConfigBuilder } from "../../../utils/AppConfigBuilder";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import {
  type SaveNotificationAndRelatedEvent,
  makeSaveNotificationAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import { DeterministShortLinkIdGeneratorGateway } from "../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { ShareConventionLinkByEmail } from "./ShareConventionLinkByEmail";

describe("ShareConventionLinkByEmail", () => {
  const email = "fake-email@yahoo.com";
  const internshipKind: InternshipKind = "immersion";
  const messageContent = "message content";
  const shortLinkId = "shortLink1";
  const config = new AppConfigBuilder().build();
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;
  let uow: InMemoryUnitOfWork;
  let usecase: ShareConventionLinkByEmail;
  let saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  let timeGateway: TimeGateway;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    timeGateway = new CustomTimeGateway();
    uow = createInMemoryUow();
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    const uuidGenerator = new UuidV4Generator();
    saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);

    usecase = new ShareConventionLinkByEmail(
      new InMemoryUowPerformer(uow),
      saveNotificationAndRelatedEvent,
      shortLinkIdGeneratorGateway,
      config,
    );
  });

  describe("Wrong paths", () => {
    afterEach(() => {
      expectObjectInArrayToMatch(uow.notificationRepository.notifications, []);
      expectObjectInArrayToMatch(uow.outboxRepository.events, []);
    });

    it("throws bad request if convention link does not come from IF domain", async () => {
      const conventionLink = "https://fake-url.com/demande-immersion";

      await expectPromiseToFailWithError(
        usecase.execute({
          conventionLink,
          email,
          details: messageContent,
          internshipKind,
        }),
        errors.url.notFromIFDomain(conventionLink),
      );
    });
  });

  describe("right path", () => {
    it("sends an email", async () => {
      const conventionLink = `${config.immersionFacileBaseUrl}/demande-immersion`;

      await usecase.execute({
        conventionLink,
        email,
        details: messageContent,
        internshipKind,
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "SHARE_DRAFT_CONVENTION_BY_LINK",
            recipients: [email],
            params: {
              internshipKind,
              additionalDetails: messageContent,
              conventionFormUrl: `${config.immersionFacileBaseUrl}/api/to/${shortLinkId}`,
            },
          },
        ],
      });
    });
  });
});
