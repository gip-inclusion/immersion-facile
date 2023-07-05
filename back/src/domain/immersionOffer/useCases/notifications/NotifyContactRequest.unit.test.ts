import {
  addressDtoToString,
  ContactEstablishmentEventPayload,
  ContactMethod,
  expectPromiseToFailWithError,
} from "shared";
import { DiscussionAggregateBuilder } from "../../../../_testBuilders/DiscussionAggregateBuilder";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../_testBuilders/makeExpectSavedNotificationsAndEvents";
import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  NotFoundError,
} from "../../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryDiscussionAggregateRepository } from "../../../../adapters/secondary/immersionOffer/InMemoryDiscussionAggregateRepository";
import {
  TEST_APPELLATION_CODE,
  TEST_APPELLATION_LABEL,
} from "../../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryRomeRepository } from "../../../../adapters/secondary/InMemoryRomeRepository";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { makeSaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
import { NotifyContactRequest } from "./NotifyContactRequest";

const siret = "11112222333344";
const discussionId = "discussion-id";

const payload: ContactEstablishmentEventPayload = {
  siret,
  discussionId,
  appellationCode: TEST_APPELLATION_CODE,
  contactMode: "PHONE",
  potentialBeneficiaryFirstName: "potential_beneficiary_name",
  potentialBeneficiaryLastName: "potential_beneficiary_last_name",
  potentialBeneficiaryEmail: "potential_beneficiary@email.fr",
};

const allowedContactEmail = "toto@gmail.com";
const allowedCopyEmail = "copy@gmail.com";

describe("NotifyContactRequest", () => {
  let discussionAggregateRepository: InMemoryDiscussionAggregateRepository;
  let romeRepository: InMemoryRomeRepository;
  let notifyContactRequest: NotifyContactRequest;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    const uow = createInMemoryUow();
    discussionAggregateRepository = uow.discussionAggregateRepository;
    romeRepository = uow.romeRepository;

    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );

    const uuidGenerator = new UuidV4Generator();
    const timeGateway = new CustomTimeGateway();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );

    notifyContactRequest = new NotifyContactRequest(
      new InMemoryUowPerformer(uow),
      saveNotificationAndRelatedEvent,
      "reply.domain.com",
    );
  });

  const prepareDiscussionInRepository = (contactMethod: ContactMethod) => {
    romeRepository.appellations = [
      {
        appellationCode: payload.appellationCode,
        appellationLabel: TEST_APPELLATION_LABEL,
        romeCode: "A0000",
        romeLabel: "Rome de test",
      },
    ];

    const discussion = new DiscussionAggregateBuilder()
      .withId(discussionId)
      .withSiret(siret)
      .withEstablishmentContact({
        email: allowedContactEmail,
        copyEmails: [allowedCopyEmail],
        contactMode: contactMethod,
      })
      .withAppellationCode(TEST_APPELLATION_CODE)
      .build();

    discussionAggregateRepository.discussionAggregates = [discussion];
    return discussion;
  };

  describe("Right paths", () => {
    it("Sends ContactByEmailRequest email to establishment", async () => {
      const validEmailPayload: ContactEstablishmentEventPayload = {
        ...payload,
        contactMode: "EMAIL",
        message: "message_to_send",
        immersionObjective: "Confirmer un projet professionnel",
        potentialBeneficiaryPhone: "0654783402",
      };

      const discussion = await prepareDiscussionInRepository("EMAIL");

      await notifyContactRequest.execute(validEmailPayload);

      const { establishmentContact } = discussion;

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "CONTACT_BY_EMAIL_REQUEST",
            recipients: [establishmentContact.email],
            replyTo: {
              email: "discussion-id_b@reply.reply.domain.com",
              name: "potential_beneficiary_name potential_beneficiary_last_name - via Immersion Facilitée",
            },
            params: {
              businessName: discussion.businessName,
              contactFirstName: establishmentContact.firstName,
              contactLastName: establishmentContact.lastName,
              appellationLabel: TEST_APPELLATION_LABEL,
              potentialBeneficiaryFirstName:
                payload.potentialBeneficiaryFirstName,
              potentialBeneficiaryLastName:
                payload.potentialBeneficiaryLastName,
              immersionObjective: validEmailPayload.immersionObjective,
              potentialBeneficiaryPhone:
                validEmailPayload.potentialBeneficiaryPhone,
              potentialBeneficiaryResumeLink:
                validEmailPayload.potentialBeneficiaryResumeLink,
              message: validEmailPayload.message,
              businessAddress: addressDtoToString(discussion.address),
            },
            cc: establishmentContact.copyEmails,
          },
        ],
      });
    });

    it("Sends ContactByPhoneRequest email to potential beneficiary", async () => {
      const validPhonePayload: ContactEstablishmentEventPayload = {
        ...payload,
        contactMode: "PHONE",
      };
      const discussion = await prepareDiscussionInRepository("PHONE");

      await notifyContactRequest.execute(validPhonePayload);

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "CONTACT_BY_PHONE_INSTRUCTIONS",
            recipients: [payload.potentialBeneficiaryEmail],
            params: {
              businessName: discussion.businessName,
              contactFirstName: discussion.establishmentContact.firstName,
              contactLastName: discussion.establishmentContact.lastName,
              contactPhone: discussion.establishmentContact.phone,
              potentialBeneficiaryFirstName:
                payload.potentialBeneficiaryFirstName,
              potentialBeneficiaryLastName:
                payload.potentialBeneficiaryLastName,
            },
          },
        ],
      });
    });

    it("Sends ContactInPersonRequest email to potential beneficiary", async () => {
      const validInPersonPayload: ContactEstablishmentEventPayload = {
        ...payload,
        contactMode: "IN_PERSON",
      };
      const discussion = await prepareDiscussionInRepository("IN_PERSON");

      await notifyContactRequest.execute(validInPersonPayload);

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "CONTACT_IN_PERSON_INSTRUCTIONS",
            recipients: [payload.potentialBeneficiaryEmail],
            params: {
              businessName: discussion.businessName,
              contactFirstName: discussion.establishmentContact.firstName,
              contactLastName: discussion.establishmentContact.lastName,
              businessAddress: addressDtoToString(discussion.address),
              potentialBeneficiaryFirstName:
                payload.potentialBeneficiaryFirstName,
              potentialBeneficiaryLastName:
                payload.potentialBeneficiaryLastName,
            },
          },
        ],
      });
    });
  });

  describe("wrong paths", () => {
    it("Missing discussion", async () => {
      const validInPersonPayload: ContactEstablishmentEventPayload = {
        ...payload,
        contactMode: "IN_PERSON",
      };

      await expectPromiseToFailWithError(
        notifyContactRequest.execute(validInPersonPayload),
        new NotFoundError(
          `No discussion found with id: ${validInPersonPayload.discussionId}`,
        ),
      );
    });

    it("Bad immersion offer with contactMode $contactMode", async () => {
      const validContactRequestByMail: ContactEstablishmentEventPayload = {
        ...payload,
        contactMode: "EMAIL",
        message: "message_to_send",
        immersionObjective: "Confirmer un projet professionnel",
        potentialBeneficiaryPhone: "0654783402",
      };

      await prepareDiscussionInRepository(payload.contactMode);
      romeRepository.appellations = [];

      await expectPromiseToFailWithError(
        notifyContactRequest.execute(validContactRequestByMail),
        new BadRequestError(
          `No appellationLabel found for appellationCode: ${payload.appellationCode}`,
        ),
      );
    });
  });
});
