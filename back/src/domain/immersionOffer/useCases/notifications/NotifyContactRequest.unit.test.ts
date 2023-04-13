import { ContactEstablishmentRequestDto } from "shared";
import { ContactEntityBuilder } from "../../../../_testBuilders/ContactEntityBuilder";
import {
  expectContactByEmailRequest,
  expectContactByPhoneInstructions,
  expectContactInPersonInstructions,
} from "../../../../_testBuilders/emailAssertions";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityBuilder } from "../../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import { InMemoryEmailGateway } from "../../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import {
  InMemoryEstablishmentAggregateRepository,
  TEST_ROME_LABEL,
} from "../../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
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
  let emailGw: InMemoryEmailGateway;
  let notifyContactRequest: NotifyContactRequest;

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    const uow = createInMemoryUow();
    establishmentAggregateRepository = uow.establishmentAggregateRepository;
    notifyContactRequest = new NotifyContactRequest(
      new InMemoryUowPerformer(uow),
      emailGw,
    );
  });

  it("Sends ContactByEmailRequest email to establishment", async () => {
    const validEmailPayload: ContactEstablishmentRequestDto = {
      ...payload,
      contactMode: "EMAIL",
      message: "message_to_send",
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

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    expectContactByEmailRequest(
      sentEmails[0],
      [contact.email],
      {
        ...immersionOffer,
        romeLabel: TEST_ROME_LABEL,
      },
      establishment,
      contact,
      validEmailPayload,
      contact.copyEmails,
    );
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

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    expectContactByPhoneInstructions(
      sentEmails[0],
      [payload.potentialBeneficiaryEmail],
      establishment,
      contact,
      validPhonePayload,
    );
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

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    expectContactInPersonInstructions(
      sentEmails[0],
      [payload.potentialBeneficiaryEmail],
      establishment,
      contact,
      validInPersonPayload,
    );
  });
});
