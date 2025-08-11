import {
  addressDtoToString,
  type ContactEstablishmentEventPayload,
  DiscussionBuilder,
  type DiscussionDtoEmail,
  type DiscussionDtoInPerson,
  type DiscussionDtoPhone,
  type DiscussionKind,
  errors,
  expectPromiseToFailWithError,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  immersionFacileNoReplyEmailSender,
  type PhoneNumber,
  UserBuilder,
} from "shared";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  EstablishmentAggregateBuilder,
  TEST_APPELLATION_CODE,
  TEST_APPELLATION_LABEL,
} from "../../helpers/EstablishmentBuilders";
import { NotifyContactRequest } from "./NotifyContactRequest";

describe("NotifyContactRequest", () => {
  const domain = "reply.domain.com";
  const immersionFacileBaseUrl = "http://if";

  const establishmentAdmin = new UserBuilder()
    .withId("admin")
    .withEmail("admin@mail.com")
    .build();
  const establishmentContact = new UserBuilder()
    .withId("contact")
    .withEmail("contact@mail.com")
    .build();
  const adminPhone: PhoneNumber = "+66355445544";

  const establishmentAggregate = new EstablishmentAggregateBuilder()
    .withUserRights([
      {
        role: "establishment-admin",
        job: "osef",
        phone: adminPhone,
        shouldReceiveDiscussionNotifications: true,
        userId: establishmentAdmin.id,
        isMainContactByPhone: false,
      },
      {
        role: "establishment-contact",
        userId: establishmentContact.id,
        shouldReceiveDiscussionNotifications: true,
      },
      {
        role: "establishment-contact",
        userId: "not-notified-user",
        shouldReceiveDiscussionNotifications: false,
      },
    ])
    .build();

  const establishmentAggregateWithContactPhone =
    new EstablishmentAggregateBuilder()
      .withEstablishmentSiret("12345678901235")
      .withContactMode("PHONE")
      .withUserRights([
        {
          role: "establishment-admin",
          job: "osef",
          phone: adminPhone,
          shouldReceiveDiscussionNotifications: true,
          userId: establishmentAdmin.id,
          isMainContactByPhone: true,
        },
        {
          role: "establishment-contact",
          userId: establishmentContact.id,
          shouldReceiveDiscussionNotifications: true,
        },
      ])
      .build();

  const establishmentAggregateWithContactPhoneNoPhone =
    new EstablishmentAggregateBuilder()
      .withEstablishmentSiret("12345678901238")
      .withContactMode("PHONE")
      .withUserRights([
        {
          role: "establishment-admin",
          job: "osef",
          phone: "0600000000",
          shouldReceiveDiscussionNotifications: true,
          userId: establishmentAdmin.id,
          isMainContactByPhone: false,
        },
        {
          role: "establishment-contact",
          userId: establishmentContact.id,
          shouldReceiveDiscussionNotifications: true,
        },
      ])
      .build();

  const establishmentAggregateWithContactInPerson =
    new EstablishmentAggregateBuilder()
      .withEstablishmentSiret("12345678901236")
      .withContactMode("IN_PERSON")
      .withUserRights([
        {
          role: "establishment-admin",
          job: "osef",
          phone: adminPhone,
          shouldReceiveDiscussionNotifications: true,
          userId: establishmentAdmin.id,
          isMainContactByPhone: false,
        },
        {
          role: "establishment-contact",
          userId: establishmentContact.id,
          shouldReceiveDiscussionNotifications: true,
          isMainContactInPerson: true,
        },
      ])
      .build();

  const establishmentAggregateWithContactInPersonNoContact =
    new EstablishmentAggregateBuilder()
      .withEstablishmentSiret("12345678901237")
      .withContactMode("IN_PERSON")
      .withUserRights([
        {
          role: "establishment-admin",
          job: "osef",
          phone: adminPhone,
          shouldReceiveDiscussionNotifications: true,
          userId: establishmentAdmin.id,
          isMainContactByPhone: false,
        },
      ])
      .build();

  let uow: InMemoryUnitOfWork;
  let notifyContactRequest: NotifyContactRequest;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();

    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );

    notifyContactRequest = new NotifyContactRequest(
      new InMemoryUowPerformer(uow),
      makeSaveNotificationAndRelatedEvent(
        new UuidV4Generator(),
        new CustomTimeGateway(),
      ),
      domain,
      immersionFacileBaseUrl,
    );

    uow.romeRepository.appellations = [
      {
        appellationCode: TEST_APPELLATION_CODE,
        appellationLabel: TEST_APPELLATION_LABEL,
        romeCode: "A0000",
        romeLabel: "Rome de test",
      },
    ];
    uow.userRepository.users = [establishmentAdmin, establishmentContact];
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishmentAggregate,
      establishmentAggregateWithContactPhone,
      establishmentAggregateWithContactInPerson,
      establishmentAggregateWithContactPhoneNoPhone,
      establishmentAggregateWithContactInPersonNoContact,
    ];
  });

  describe("Right paths", () => {
    describe("Contact mode email", () => {
      it.each(["1_ELEVE_1_STAGE", "IF"] satisfies DiscussionKind[])(
        "Sends ContactByEmailRequest email to establishment users that are only notified with an email kind %s  ",
        async (kind) => {
          const discussion = new DiscussionBuilder()
            .withSiret(establishmentAggregate.establishment.siret)
            .withContactMode("EMAIL")
            .withDiscussionKind(kind)
            .withAppellationCode(TEST_APPELLATION_CODE)
            .build() as DiscussionDtoEmail;

          uow.discussionRepository.discussions = [discussion];

          const validEmailPayload: ContactEstablishmentEventPayload = {
            discussionId: discussion.id,
            siret: discussion.siret,
          };

          await notifyContactRequest.execute(validEmailPayload);

          const expectedReplyToEmail = `${discussion.potentialBeneficiary.firstName}_${discussion.potentialBeneficiary.lastName}__${discussion.id}_b@reply.reply.domain.com`;

          expectSavedNotificationsAndEvents({
            emails: [
              {
                kind: "CONTACT_BY_EMAIL_REQUEST",
                recipients: [
                  establishmentAdmin.email,
                  establishmentContact.email,
                ],
                sender: immersionFacileNoReplyEmailSender,
                replyTo: {
                  email: expectedReplyToEmail,
                  name: `${getFormattedFirstnameAndLastname({ firstname: discussion.potentialBeneficiary.firstName, lastname: discussion.potentialBeneficiary.lastName })} - via Immersion Facilitée`,
                },
                params:
                  discussion.kind === "IF"
                    ? {
                        replyToEmail: expectedReplyToEmail,
                        appellationLabel: TEST_APPELLATION_LABEL,
                        businessAddress: addressDtoToString(discussion.address),
                        businessName: discussion.businessName,
                        discussionUrl: `${immersionFacileBaseUrl}/${frontRoutes.establishmentDashboardDiscussions}/${discussion.id}?mtm_campaign=inbound-parsing-reponse-via-espace-entreprise&mtm_kwd=inbound-parsing-reponse-via-espace-entreprise`,
                        kind: discussion.kind,
                        immersionObjective:
                          discussion.potentialBeneficiary.immersionObjective ??
                          undefined,
                        potentialBeneficiaryFirstName:
                          getFormattedFirstnameAndLastname({
                            firstname:
                              discussion.potentialBeneficiary.firstName,
                          }),
                        potentialBeneficiaryLastName:
                          getFormattedFirstnameAndLastname({
                            lastname: discussion.potentialBeneficiary.lastName,
                          }),
                        potentialBeneficiaryDatePreferences:
                          discussion.potentialBeneficiary.datePreferences,
                        potentialBeneficiaryPhone:
                          discussion.potentialBeneficiary.phone,
                        potentialBeneficiaryExperienceAdditionalInformation:
                          discussion.potentialBeneficiary
                            .experienceAdditionalInformation,
                        potentialBeneficiaryHasWorkingExperience:
                          discussion.potentialBeneficiary.hasWorkingExperience,
                        potentialBeneficiaryResumeLink:
                          discussion.potentialBeneficiary.resumeLink,
                      }
                    : {
                        replyToEmail: expectedReplyToEmail,
                        appellationLabel: TEST_APPELLATION_LABEL,
                        businessAddress: addressDtoToString(discussion.address),
                        businessName: discussion.businessName,
                        discussionUrl: `${immersionFacileBaseUrl}/${frontRoutes.establishmentDashboardDiscussions}/${discussion.id}?mtm_campaign=inbound-parsing-reponse-via-espace-entreprise&mtm_kwd=inbound-parsing-reponse-via-espace-entreprise`,
                        kind: discussion.kind,
                        immersionObjective:
                          discussion.potentialBeneficiary.immersionObjective,
                        potentialBeneficiaryFirstName:
                          getFormattedFirstnameAndLastname({
                            firstname:
                              discussion.potentialBeneficiary.firstName,
                          }),
                        potentialBeneficiaryLastName:
                          getFormattedFirstnameAndLastname({
                            lastname: discussion.potentialBeneficiary.lastName,
                          }),
                        potentialBeneficiaryDatePreferences:
                          discussion.potentialBeneficiary.datePreferences,
                        potentialBeneficiaryPhone:
                          discussion.potentialBeneficiary.phone,
                        levelOfEducation:
                          discussion.potentialBeneficiary.levelOfEducation,
                      },
              },
            ],
          });
        },
      );
    });

    describe("Contact mode phone", () => {
      it.each(["1_ELEVE_1_STAGE", "IF"] satisfies DiscussionKind[])(
        "Sends ContactByPhoneRequest email to potential beneficiary with an email kind %s",
        async () => {
          const discussion = new DiscussionBuilder()
            .withSiret(
              establishmentAggregateWithContactPhone.establishment.siret,
            )
            .withContactMode("PHONE")
            .withAppellationCode(TEST_APPELLATION_CODE)
            .build() as DiscussionDtoPhone;

          uow.discussionRepository.discussions = [discussion];

          const validPhonePayload: ContactEstablishmentEventPayload = {
            discussionId: discussion.id,
            siret: discussion.siret,
          };

          await notifyContactRequest.execute(validPhonePayload);

          expectSavedNotificationsAndEvents({
            emails: [
              {
                kind: "CONTACT_BY_PHONE_INSTRUCTIONS",
                recipients: [discussion.potentialBeneficiary.email],
                sender: immersionFacileNoReplyEmailSender,
                params: {
                  businessName: discussion.businessName,
                  contactFirstName: getFormattedFirstnameAndLastname({
                    firstname: establishmentAdmin.firstName,
                  }),
                  contactLastName: getFormattedFirstnameAndLastname({
                    lastname: establishmentAdmin.lastName,
                  }),
                  contactPhone: adminPhone,
                  kind: discussion.kind,
                  potentialBeneficiaryFirstName:
                    getFormattedFirstnameAndLastname({
                      firstname: discussion.potentialBeneficiary.firstName,
                    }),
                  potentialBeneficiaryLastName:
                    getFormattedFirstnameAndLastname({
                      lastname: discussion.potentialBeneficiary.lastName,
                    }),
                },
              },
            ],
          });
        },
      );
    });

    describe("Contact mode in person", () => {
      it.each(["1_ELEVE_1_STAGE", "IF"] satisfies DiscussionKind[])(
        "Sends ContactInPersonRequest email to potential beneficiary with an email kind %s ",
        async () => {
          const discussion = new DiscussionBuilder()
            .withSiret(
              establishmentAggregateWithContactInPerson.establishment.siret,
            )
            .withContactMode("IN_PERSON")
            .withAppellationCode(TEST_APPELLATION_CODE)
            .build() as DiscussionDtoInPerson;

          uow.discussionRepository.discussions = [discussion];

          const validInPersonPayload: ContactEstablishmentEventPayload = {
            discussionId: discussion.id,
            siret: discussion.siret,
          };

          await notifyContactRequest.execute(validInPersonPayload);

          expectSavedNotificationsAndEvents({
            emails: [
              {
                kind: "CONTACT_IN_PERSON_INSTRUCTIONS",
                recipients: [discussion.potentialBeneficiary.email],
                sender: immersionFacileNoReplyEmailSender,
                params: {
                  businessName: discussion.businessName,
                  contactFirstName: getFormattedFirstnameAndLastname({
                    firstname: establishmentAdmin.firstName,
                  }),
                  contactLastName: getFormattedFirstnameAndLastname({
                    lastname: establishmentAdmin.lastName,
                  }),
                  welcomeAddress: addressDtoToString(discussion.address),
                  kind: discussion.kind,
                  potentialBeneficiaryFirstName:
                    getFormattedFirstnameAndLastname({
                      firstname: discussion.potentialBeneficiary.firstName,
                    }),
                  potentialBeneficiaryLastName:
                    getFormattedFirstnameAndLastname({
                      lastname: discussion.potentialBeneficiary.lastName,
                    }),
                },
              },
            ],
          });
        },
      );
    });
  });

  describe("wrong paths", () => {
    it("Missing discussion", async () => {
      const discussionId = "missing";

      await expectPromiseToFailWithError(
        notifyContactRequest.execute({
          discussionId,
          siret: "12345678901234",
        }),
        errors.discussion.notFound({
          discussionId,
        }),
      );
    });

    it("Bad immersion offer with contactMode EMAIL", async () => {
      const discussion = new DiscussionBuilder()
        .withSiret(establishmentAggregate.establishment.siret)
        .withContactMode("EMAIL")
        .withAppellationCode(TEST_APPELLATION_CODE)
        .build();

      uow.discussionRepository.discussions = [discussion];
      uow.romeRepository.appellations = [];

      await expectPromiseToFailWithError(
        notifyContactRequest.execute({
          discussionId: discussion.id,
          siret: discussion.siret,
        }),
        errors.rome.missingAppellation({
          appellationCode: discussion.appellationCode,
        }),
      );
    });
    it("No user right to contact (isMainContactByPhone false) with contactMode PHONE", async () => {
      const discussion = new DiscussionBuilder()
        .withSiret(
          establishmentAggregateWithContactPhoneNoPhone.establishment.siret,
        )
        .withContactMode("PHONE")
        .withAppellationCode(TEST_APPELLATION_CODE)
        .build();

      uow.discussionRepository.discussions = [discussion];

      await expectPromiseToFailWithError(
        notifyContactRequest.execute({
          discussionId: discussion.id,
          siret: discussion.siret,
        }),
        errors.establishment.contactUserNotFound({
          siret: discussion.siret,
        }),
      );
    });
    it("No user right to contact (isMainContactInPerson false) with contactMode IN_PERSON", async () => {
      const discussion = new DiscussionBuilder()
        .withSiret(
          establishmentAggregateWithContactInPersonNoContact.establishment
            .siret,
        )
        .withContactMode("IN_PERSON")
        .withAppellationCode(TEST_APPELLATION_CODE)
        .build();

      uow.discussionRepository.discussions = [discussion];

      await expectPromiseToFailWithError(
        notifyContactRequest.execute({
          discussionId: discussion.id,
          siret: discussion.siret,
        }),
        errors.establishment.contactUserNotFound({
          siret: discussion.siret,
        }),
      );
    });
  });
});
