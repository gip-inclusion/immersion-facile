import { AllowListEmailFilter } from "../../../adapters/secondary/core/EmailFilterImplementations";
import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { EmailFilter } from "../../../domain/core/ports/EmailFilter";
import { NotifyContactRequest } from "../../../domain/immersionOffer/useCases/notifications/NotifyContactRequest";
import { ContactEstablishmentRequestDto } from "../../../shared/contactEstablishment";
import { ContactEntityV2Builder } from "../../../_testBuilders/ContactEntityV2Builder";
import {
  expectContactByEmailRequest,
  expectContactByPhoneInstructions,
  expectContactInPersonInstructions,
} from "../../../_testBuilders/emailAssertions";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../../_testBuilders/EstablishmentEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";

const contact = new ContactEntityV2Builder().build();
const immersionOffer = new ImmersionOfferEntityV2Builder().build();

const payload: ContactEstablishmentRequestDto = {
  immersionOfferId: immersionOffer.id,
  contactMode: "PHONE",
  potentialBeneficiaryFirstName: "potential_beneficiary_name",
  potentialBeneficiaryLastName: "potential_beneficiary_last_name",
  potentialBeneficiaryEmail: "potential_beneficiary@email.fr",
};

describe("NotifyContactRequest", () => {
  let immersionOfferRepository: InMemoryImmersionOfferRepository;
  let emailGw: InMemoryEmailGateway;
  let emailFilter: EmailFilter;

  beforeEach(() => {
    immersionOfferRepository = new InMemoryImmersionOfferRepository().empty();
    emailGw = new InMemoryEmailGateway();
    emailFilter = new AllowListEmailFilter([
      contact.email,
      payload.potentialBeneficiaryEmail,
    ]);
  });

  const createUseCase = () => {
    return new NotifyContactRequest(
      immersionOfferRepository,
      emailFilter,
      emailGw,
    );
  };

  test("Sends ContactByEmailRequest email to establishment", async () => {
    const validEmailPayload: ContactEstablishmentRequestDto = {
      ...payload,
      contactMode: "EMAIL",
      message: "message_to_send",
    };
    const establishment = new EstablishmentEntityV2Builder()
      .withContactMode("EMAIL")
      .build();

    await immersionOfferRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContacts([contact])
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    await createUseCase().execute(validEmailPayload);

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    expectContactByEmailRequest(
      sentEmails[0],
      [contact.email],
      establishment,
      contact,
      validEmailPayload,
    );
  });

  test("Sends ContactByPhoneRequest email to potential beneficiary", async () => {
    const validPhonePayload: ContactEstablishmentRequestDto = {
      ...payload,
      contactMode: "PHONE",
    };
    const establishment = new EstablishmentEntityV2Builder()
      .withContactMode("PHONE")
      .build();
    await immersionOfferRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContacts([contact])
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    await createUseCase().execute(validPhonePayload);

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

  test("Sends ContactInPersonRequest email to potential beneficiary", async () => {
    const validInPersonPayload: ContactEstablishmentRequestDto = {
      ...payload,
      contactMode: "IN_PERSON",
    };
    const establishment = new EstablishmentEntityV2Builder()
      .withContactMode("IN_PERSON")
      .build();
    await immersionOfferRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContacts([contact])
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    await createUseCase().execute(validInPersonPayload);

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

  test("Sends no email when allowList is enforced and empty", async () => {
    emailFilter = new AllowListEmailFilter([]);

    const validInPersonPayload: ContactEstablishmentRequestDto = {
      ...payload,
      contactMode: "IN_PERSON",
    };
    const establishment = new EstablishmentEntityV2Builder()
      .withContactMode("IN_PERSON")
      .build();
    await immersionOfferRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContacts([contact])
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    await createUseCase().execute(validInPersonPayload);

    expect(emailGw.getSentEmails()).toHaveLength(0);
  });
});
