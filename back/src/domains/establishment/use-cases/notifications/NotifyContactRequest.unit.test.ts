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
  TEST_APPELLATION_CODE,
  TEST_APPELLATION_LABEL,
} from "../../helpers/EstablishmentBuilders";
import { NotifyContactRequest } from "./NotifyContactRequest";

describe("NotifyContactRequest", () => {
  const siret = "11112222333344";
  const discussionId = "discussion-id";
  const allowedContactEmail = "toto@gmail.com";
  const allowedCopyEmail = "copy@gmail.com";

  let uow: InMemoryUnitOfWork;
  let notifyContactRequest: NotifyContactRequest;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  const domain = "reply.domain.com";
  const immersionFacileBaseUrl = "http://if";

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
  });

  describe("Right paths", () => {
    describe("Contact mode email", () => {
      it.each(["1_ELEVE_1_STAGE", "IF"] satisfies DiscussionKind[])(
        "Sends ContactByEmailRequest email with kind %s to establishment ",
        async (kind) => {
          const discussion = new DiscussionBuilder()
            .withId(discussionId)
            .withSiret(siret)
            .withContactMode("EMAIL")
            .withDiscussionKind(kind)
            .withEstablishmentContact({
              email: allowedContactEmail,
              copyEmails: [allowedCopyEmail],
            })
            .withAppellationCode(TEST_APPELLATION_CODE)
            .build() as DiscussionDtoEmail;

          uow.discussionRepository.discussions = [discussion];

          const validEmailPayload: ContactEstablishmentEventPayload = {
            discussionId: discussion.id,
            siret: discussion.siret,
          };

          await notifyContactRequest.execute(validEmailPayload);

          const { establishmentContact } = discussion;

          const expectedReplyToEmail = `${discussion.potentialBeneficiary.firstName}_${discussion.potentialBeneficiary.lastName}__${discussion.id}_b@reply.reply.domain.com`;

          expectSavedNotificationsAndEvents({
            emails: [
              {
                kind: "CONTACT_BY_EMAIL_REQUEST",
                recipients: [establishmentContact.email],
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
                        contactFirstName: getFormattedFirstnameAndLastname({
                          firstname: establishmentContact.firstName,
                        }),
                        contactLastName: getFormattedFirstnameAndLastname({
                          lastname: establishmentContact.lastName,
                        }),
                        discussionUrl: `${immersionFacileBaseUrl}/${frontRoutes.establishmentDashboardDiscussions}/${discussion.id}&mtm_campaign=inbound-parsing-reponse-via-espace-entreprise&mtm_kwd=inbound-parsing-reponse-via-espace-entreprise`,
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
                        contactFirstName: getFormattedFirstnameAndLastname({
                          firstname: establishmentContact.firstName,
                        }),
                        contactLastName: getFormattedFirstnameAndLastname({
                          lastname: establishmentContact.lastName,
                        }),
                        discussionUrl: `${immersionFacileBaseUrl}/${frontRoutes.establishmentDashboardDiscussions}/${discussion.id}&mtm_campaign=inbound-parsing-reponse-via-espace-entreprise&mtm_kwd=inbound-parsing-reponse-via-espace-entreprise`,
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
                cc: establishmentContact.copyEmails,
              },
            ],
          });
        },
      );
    });

    describe("Contact mode phone", () => {
      it.each(["1_ELEVE_1_STAGE", "IF"] satisfies DiscussionKind[])(
        "Sends ContactByPhoneRequest email with kind %s to potential beneficiary",
        async () => {
          const discussion = new DiscussionBuilder()
            .withId(discussionId)
            .withSiret(siret)
            .withContactMode("PHONE")
            .withEstablishmentContact({
              email: allowedContactEmail,
              copyEmails: [allowedCopyEmail],
            })
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
                  contactFirstName: discussion.establishmentContact.firstName,
                  contactLastName: discussion.establishmentContact.lastName,
                  contactPhone: discussion.establishmentContact.phone,
                  kind: discussion.kind,
                  potentialBeneficiaryFirstName:
                    discussion.potentialBeneficiary.firstName,
                  potentialBeneficiaryLastName:
                    discussion.potentialBeneficiary.lastName,
                },
              },
            ],
          });
        },
      );
    });

    describe("Contact mode in person", () => {
      it.each(["1_ELEVE_1_STAGE", "IF"] satisfies DiscussionKind[])(
        "Sends ContactInPersonRequest email with kind %s to potential beneficiary",
        async () => {
          const discussion = new DiscussionBuilder()
            .withId(discussionId)
            .withSiret(siret)
            .withContactMode("IN_PERSON")
            .withEstablishmentContact({
              email: allowedContactEmail,
              copyEmails: [allowedCopyEmail],
            })
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
                  contactFirstName: discussion.establishmentContact.firstName,
                  contactLastName: discussion.establishmentContact.lastName,
                  businessAddress: addressDtoToString(discussion.address),
                  kind: discussion.kind,
                  potentialBeneficiaryFirstName:
                    discussion.potentialBeneficiary.firstName,
                  potentialBeneficiaryLastName:
                    discussion.potentialBeneficiary.lastName,
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
      const validInPersonPayload: ContactEstablishmentEventPayload = {
        discussionId,
        siret: "12345678901234",
      };

      await expectPromiseToFailWithError(
        notifyContactRequest.execute(validInPersonPayload),
        errors.discussion.notFound({
          discussionId: validInPersonPayload.discussionId,
        }),
      );
    });

    it("Bad immersion offer with contactMode EMAIL", async () => {
      const discussion = new DiscussionBuilder()
        .withId(discussionId)
        .withSiret(siret)
        .withContactMode("EMAIL")
        .withEstablishmentContact({
          email: allowedContactEmail,
          copyEmails: [allowedCopyEmail],
        })
        .withAppellationCode(TEST_APPELLATION_CODE)
        .build() as DiscussionDtoEmail;

      uow.discussionRepository.discussions = [discussion];

      const validContactRequestByMail: ContactEstablishmentEventPayload = {
        discussionId: discussion.id,
        siret: discussion.siret,
      };

      uow.romeRepository.appellations = [];

      await expectPromiseToFailWithError(
        notifyContactRequest.execute(validContactRequestByMail),
        errors.discussion.missingAppellationLabel({
          appellationCode: discussion.appellationCode,
        }),
      );
    });
  });
});
