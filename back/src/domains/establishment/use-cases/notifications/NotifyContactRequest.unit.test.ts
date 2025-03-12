import {
  type ContactEstablishmentEventPayload,
  type ContactMethod,
  DiscussionBuilder,
  addressDtoToString,
  errors,
  expectPromiseToFailWithError,
  immersionFacileNoReplyEmailSender,
} from "shared";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  TEST_APPELLATION_CODE,
  TEST_APPELLATION_LABEL,
} from "../../helpers/EstablishmentBuilders";
import { NotifyContactRequest } from "./NotifyContactRequest";

const siret = "11112222333344";
const discussionId = "discussion-id";
const allowedContactEmail = "toto@gmail.com";
const allowedCopyEmail = "copy@gmail.com";

describe("NotifyContactRequest", () => {
  let uow: InMemoryUnitOfWork;
  let notifyContactRequest: NotifyContactRequest;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  const domain = "reply.domain.com";

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

  const prepareDiscussionInRepository = (contactMethod: ContactMethod) => {
    const discussion = new DiscussionBuilder()
      .withId(discussionId)
      .withSiret(siret)
      .withEstablishmentContact({
        email: allowedContactEmail,
        copyEmails: [allowedCopyEmail],
        contactMethod,
      })
      .withAppellationCode(TEST_APPELLATION_CODE)
      .build();

    uow.discussionRepository.discussions = [discussion];
    return discussion;
  };

  describe("Right paths", () => {
    it("Sends ContactByEmailRequest email to establishment", async () => {
      const discussion = await prepareDiscussionInRepository("EMAIL");
      const validEmailPayload: ContactEstablishmentEventPayload = {
        discussionId: discussion.id,
        siret: discussion.siret,
      };

      await notifyContactRequest.execute(validEmailPayload);

      const { establishmentContact } = discussion;

      const expectedReplyToEmail = "discussion-id_b@reply.reply.domain.com";

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "CONTACT_BY_EMAIL_REQUEST",
            recipients: [establishmentContact.email],
            sender: immersionFacileNoReplyEmailSender,
            replyTo: {
              email: expectedReplyToEmail,
              name: `${discussion.potentialBeneficiary.firstName} ${discussion.potentialBeneficiary.lastName} - via Immersion Facilitée`,
            },
            params: {
              replyToEmail: expectedReplyToEmail,
              businessName: discussion.businessName,
              contactFirstName: establishmentContact.firstName,
              contactLastName: establishmentContact.lastName,
              appellationLabel: TEST_APPELLATION_LABEL,
              potentialBeneficiaryDatePreferences:
                discussion.potentialBeneficiary.datePreferences,
              potentialBeneficiaryExperienceAdditionalInformation:
                discussion.potentialBeneficiary.experienceAdditionalInformation,
              potentialBeneficiaryHasWorkingExperience:
                discussion.potentialBeneficiary.hasWorkingExperience,
              potentialBeneficiaryFirstName:
                discussion.potentialBeneficiary.firstName,
              potentialBeneficiaryLastName:
                discussion.potentialBeneficiary.lastName,
              immersionObjective: discussion.immersionObjective ?? undefined,
              potentialBeneficiaryPhone:
                discussion.potentialBeneficiary.phone ??
                "pas de téléphone fourni",
              potentialBeneficiaryResumeLink:
                discussion.potentialBeneficiary.resumeLink,
              businessAddress: addressDtoToString(discussion.address),
              domain,
              discussionId: discussion.id,
            },
            cc: establishmentContact.copyEmails,
          },
        ],
      });
    });

    it("Sends ContactByPhoneRequest email to potential beneficiary", async () => {
      const discussion = await prepareDiscussionInRepository("PHONE");
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
              potentialBeneficiaryFirstName:
                discussion.potentialBeneficiary.firstName,
              potentialBeneficiaryLastName:
                discussion.potentialBeneficiary.lastName,
            },
          },
        ],
      });
    });

    it("Sends ContactInPersonRequest email to potential beneficiary", async () => {
      const discussion = await prepareDiscussionInRepository("IN_PERSON");
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
              potentialBeneficiaryFirstName:
                discussion.potentialBeneficiary.firstName,
              potentialBeneficiaryLastName:
                discussion.potentialBeneficiary.lastName,
            },
          },
        ],
      });
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

    it("Bad immersion offer with contactMode $contactMode", async () => {
      const discussion = await prepareDiscussionInRepository("EMAIL");
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
