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

describe("Feature - SendEmailWhenAgencyIsRejected", () => {
  const agency = AgencyDtoBuilder.create()
    .withName("just-rejected-agency")
    .withLogoUrl("https://logo.com")
    .withStatus("rejected")
    .withRejectionJustification("rejection justification")
    .build();

  const [
    user1,
    user2,
    user3,
    user4,
    user5,
    user6,
    user7,
    user8,
    user9,
    user10,
  ] = [...Array(10).keys()].map((i) =>
    new InclusionConnectedUserBuilder()
      .withId(`user${i + 1}`)
      .withEmail(`user${i + 1}@email.com`)
      .build(),
  );

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

    uow.userRepository.users = [
      user1,
      user2,
      user3,
      user4,
      user5,
      user6,
      user7,
      user8,
      user9,
      user10,
    ];
  });

  describe("With success feedback scenarios", () => {
    it("If the agency doesn't refer to another agency then the feature sends a AGENCY_WAS_REJECTED notification to all agency's users that have notification enabled.", async () => {
      // Prepare
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [user1.id]: {
            isNotifiedByEmail: true,
            roles: ["agency-admin"],
          },
          [user2.id]: {
            isNotifiedByEmail: false,
            roles: ["agency-admin"],
          },
          [user3.id]: {
            isNotifiedByEmail: true,
            roles: ["validator", "agency-admin"],
          },
          [user4.id]: {
            isNotifiedByEmail: false,
            roles: ["validator"],
          },
          [user5.id]: {
            isNotifiedByEmail: true,
            roles: ["counsellor"],
          },
          [user6.id]: {
            isNotifiedByEmail: false,
            roles: ["counsellor"],
          },
          [user7.id]: {
            isNotifiedByEmail: true,
            roles: ["agency-viewer"],
          },
        }),
      ];

      // Act
      await useCase.execute({ agencyId: agency.id });

      // Assert
      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "AGENCY_WAS_REJECTED",
            recipients: [user1.email, user3.email, user5.email, user7.email],
            params: {
              agencyName: agency.name,
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              rejectionJustification: agency.rejectionJustification!,
            },
          },
        ],
      });
    });

    it("If the agency A refers to agency B then the feature sends a AGENCY_WAS_REJECTED notification to all agency A's users that have notification enabled and agency B's admins that have notification enabled.", async () => {
      // Prepare
      const agencyWithRefersTo = AgencyDtoBuilder.create()
        .withId("agencyWithRefersTo")
        .withName("just-rejected-agency-refered-to-other-agency")
        .withLogoUrl("https://logo-refers-to.com")
        .withStatus("rejected")
        .withRejectionJustification(
          "rejection justification for agency with refers to",
        )
        .withRefersToAgencyInfo({
          refersToAgencyId: agency.id,
          refersToAgencyName: agency.name,
        })
        .build();

      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [user1.id]: {
            isNotifiedByEmail: true,
            roles: ["agency-admin"],
          },
          [user2.id]: {
            isNotifiedByEmail: false,
            roles: ["agency-admin"],
          },
          [user3.id]: {
            isNotifiedByEmail: true,
            roles: ["counsellor"],
          },
        }),
        toAgencyWithRights(agencyWithRefersTo, {
          [user4.id]: {
            isNotifiedByEmail: true,
            roles: ["agency-admin"],
          },
          [user5.id]: {
            isNotifiedByEmail: false,
            roles: ["agency-admin"],
          },
          [user6.id]: {
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
          [user7.id]: {
            isNotifiedByEmail: false,
            roles: ["validator"],
          },
          [user8.id]: {
            isNotifiedByEmail: true,
            roles: ["counsellor"],
          },
          [user9.id]: {
            isNotifiedByEmail: false,
            roles: ["counsellor"],
          },
          [user10.id]: {
            isNotifiedByEmail: true,
            roles: ["agency-viewer"],
          },
        }),
      ];

      // Act
      await useCase.execute({ agencyId: agencyWithRefersTo.id });

      // Assert
      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "AGENCY_WAS_REJECTED",
            recipients: [
              user1.email,
              user4.email,
              user6.email,
              user8.email,
              user10.email,
            ],
            params: {
              agencyName: agencyWithRefersTo.name,
              rejectionJustification:
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                agencyWithRefersTo.rejectionJustification!,
            },
          },
        ],
      });
    });
  });

  describe("With error feedback scenarios", () => {
    it("If the agency is missing then the feature raise a not found error.", async () => {
      // Prepare
      uow.agencyRepository.agencies = [];

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

    it("If the agency don't have a rejection justification then the feature raise a not rejected error.", async () => {
      // Prepare
      uow.agencyRepository.agencies = [
        toAgencyWithRights(
          new AgencyDtoBuilder(agency).withRejectionJustification(null).build(),
          {
            [user4.id]: {
              isNotifiedByEmail: true,
              roles: ["validator"],
            },
          },
        ),
      ];

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

    it("If the agency have a rejection justification but don't have rejected status then the feature raise a bad agency status error.", async () => {
      const agencyActiveWithJustification = new AgencyDtoBuilder(agency)
        .withStatus("active")
        .withRejectionJustification("justif")
        .build();
      // Prepare
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agencyActiveWithJustification, {
          [user4.id]: {
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
          [user2.id]: {
            isNotifiedByEmail: true,
            roles: ["counsellor"],
          },
        }),
      ];

      uow.userRepository.users = [];

      // Act
      await expectPromiseToFailWithError(
        useCase.execute({ agencyId: agencyActiveWithJustification.id }),
        errors.agency.invalidStatus({
          id: agencyActiveWithJustification.id,
          actual: agencyActiveWithJustification.status,
          expected: "rejected",
        }),
      );

      // Assert
      expectSavedNotificationsAndEvents({
        emails: [],
      });
    });

    it("If some users is missing then the feature raise a users not found error.", async () => {
      // Prepare
      uow.agencyRepository.agencies = [
        toAgencyWithRights(
          new AgencyDtoBuilder(agency)
            .withRejectionJustification("justif")
            .build(),
          {
            [user4.id]: {
              isNotifiedByEmail: true,
              roles: ["validator"],
            },
            [user2.id]: {
              isNotifiedByEmail: true,
              roles: ["counsellor"],
            },
          },
        ),
      ];

      uow.userRepository.users = [];

      // Act
      await expectPromiseToFailWithError(
        useCase.execute({ agencyId: agency.id }),
        errors.users.notFound({ userIds: [user4.id, user2.id] }),
      );

      // Assert
      expectSavedNotificationsAndEvents({
        emails: [],
      });
    });
  });
});
