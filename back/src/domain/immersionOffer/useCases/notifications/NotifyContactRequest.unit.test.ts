import { addressDtoToString, ContactEstablishmentRequestDto } from "shared";
import { ContactEntityBuilder } from "../../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityBuilder } from "../../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../../_testBuilders/ImmersionOfferEntityV2Builder";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../_testBuilders/makeExpectSavedNotificationsAndEvents";
import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import {
  InMemoryEstablishmentAggregateRepository,
  TEST_ROME_LABEL,
} from "../../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { makeSaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
import { NotifyContactRequest } from "./NotifyContactRequest";

const immersionOffer = new ImmersionOfferEntityV2Builder().build();

const siret = "11112222333344";
const contactId = "theContactId";
const TEST_ROME_CODE = "B9112";

const payload: ContactEstablishmentRequestDto = {
  siret,
  offer: { romeCode: TEST_ROME_CODE, romeLabel: TEST_ROME_LABEL },
  contactMode: "PHONE",
  potentialBeneficiaryFirstName: "potential_beneficiary_name",
  potentialBeneficiaryLastName: "potential_beneficiary_last_name",
  potentialBeneficiaryEmail: "potential_beneficiary@email.fr",
};

const allowedContactEmail = "toto@gmail.com";
const allowedCopyEmail = "copy@gmail.com";

describe("NotifyContactRequest", () => {
  let establishmentAggregateRepository: InMemoryEstablishmentAggregateRepository;
  let notifyContactRequest: NotifyContactRequest;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    const uow = createInMemoryUow();
    establishmentAggregateRepository = uow.establishmentAggregateRepository;

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
    );
  });

  it("Sends ContactByEmailRequest email to establishment", async () => {
    const validEmailPayload: ContactEstablishmentRequestDto = {
      ...payload,
      contactMode: "EMAIL",
      message: "message_to_send",
      immersionObjective: "Confirmer un projet professionnel",
      potentialBeneficiaryPhone: "0654783402",
    };
    const establishment = new EstablishmentEntityBuilder()
      .withSiret(siret)
      .build();
    const contact = new ContactEntityBuilder()
      .withId(contactId)
      .withContactMethod("EMAIL")
      .withEmail(allowedContactEmail)
      .withCopyEmails([allowedCopyEmail])
      .build();
    await establishmentAggregateRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContact(contact)
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    await notifyContactRequest.execute(validEmailPayload);

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "CONTACT_BY_EMAIL_REQUEST",
          recipients: [contact.email],
          params: {
            businessName: establishment.name,
            contactFirstName: contact.firstName,
            contactLastName: contact.lastName,
            appellationLabel: TEST_ROME_LABEL,
            potentialBeneficiaryFirstName:
              payload.potentialBeneficiaryFirstName,
            potentialBeneficiaryLastName: payload.potentialBeneficiaryLastName,
            potentialBeneficiaryEmail: payload.potentialBeneficiaryEmail,
            immersionObjective: validEmailPayload.immersionObjective,
            potentialBeneficiaryPhone:
              validEmailPayload.potentialBeneficiaryPhone,
            potentialBeneficiaryResumeLink:
              validEmailPayload.potentialBeneficiaryResumeLink,
            message: validEmailPayload.message,
          },
          cc: contact.copyEmails,
        },
      ],
    });
  });

  it("Sends ContactByPhoneRequest email to potential beneficiary", async () => {
    const validPhonePayload: ContactEstablishmentRequestDto = {
      ...payload,
      contactMode: "PHONE",
    };
    const establishment = new EstablishmentEntityBuilder()
      .withSiret(siret)
      .build();
    const contact = new ContactEntityBuilder()
      .withId(contactId)
      .withContactMethod("PHONE")
      .build();
    await establishmentAggregateRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContact(contact)
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    await notifyContactRequest.execute(validPhonePayload);

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "CONTACT_BY_PHONE_INSTRUCTIONS",
          recipients: [payload.potentialBeneficiaryEmail],
          params: {
            businessName: establishment.name,
            contactFirstName: contact.firstName,
            contactLastName: contact.lastName,
            contactPhone: contact.phone,
            potentialBeneficiaryFirstName:
              payload.potentialBeneficiaryFirstName,
            potentialBeneficiaryLastName: payload.potentialBeneficiaryLastName,
          },
        },
      ],
    });
  });

  it("Sends ContactInPersonRequest email to potential beneficiary", async () => {
    const validInPersonPayload: ContactEstablishmentRequestDto = {
      ...payload,
      contactMode: "IN_PERSON",
    };
    const establishment = new EstablishmentEntityBuilder()
      .withSiret(siret)
      .build();
    const contact = new ContactEntityBuilder()
      .withId(contactId)
      .withContactMethod("IN_PERSON")
      .build();
    await establishmentAggregateRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContact(contact)
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    await notifyContactRequest.execute(validInPersonPayload);

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "CONTACT_IN_PERSON_INSTRUCTIONS",
          recipients: [payload.potentialBeneficiaryEmail],
          params: {
            businessName: establishment.name,
            contactFirstName: contact.firstName,
            contactLastName: contact.lastName,
            businessAddress: addressDtoToString(establishment.address),
            potentialBeneficiaryFirstName:
              payload.potentialBeneficiaryFirstName,
            potentialBeneficiaryLastName: payload.potentialBeneficiaryLastName,
          },
        },
      ],
    });
  });
});
