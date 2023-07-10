import { ContactMethod, expectPromiseToFailWith, expectToEqual } from "shared";
import { ContactEntityBuilder } from "../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/establishmentAggregate.test.helpers";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import {
  ContactEstablishmentByMailPublicV1Dto,
  ContactEstablishmentPublicV1Dto,
} from "../../../adapters/primary/routers/DtoAndSchemas/v1/input/ContactEstablishmentPublicV1.dto";
import { InMemoryEstablishmentAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { ConvertContactEstablishmentPublicV1ToDomain } from "./ConvertContactEstablishmentPublicV1ToDomain";

const siret = "11112222333344";
const contactId = "theContactId";
const romeCode = "M1808";
const establishment = new EstablishmentEntityBuilder().withSiret(siret).build();

const immersionOffer = new ImmersionOfferEntityV2Builder()
  .withRomeCode(romeCode)
  .withAppellationCode("11704")
  .build();

const makeValidV1ContactRequest = <T extends ContactMethod>(
  contactMode: T,
): Extract<ContactEstablishmentPublicV1Dto, { contactMode: T }> => {
  const commonFields = {
    offer: { romeLabel: "Information géographique", romeCode },
    siret,
    contactMode,
    potentialBeneficiaryFirstName: "potential_beneficiary_first_name",
    potentialBeneficiaryLastName: "potential_beneficiary_last_name",
    potentialBeneficiaryEmail: "potential_beneficiary@email.fr",
  };
  if (contactMode === "EMAIL") {
    const emailContact: ContactEstablishmentByMailPublicV1Dto = {
      ...commonFields,
      message: "message",
      contactMode,
    };
    return emailContact as Extract<
      ContactEstablishmentPublicV1Dto,
      { contactMode: T }
    >;
  }

  return commonFields as Extract<
    ContactEstablishmentPublicV1Dto,
    { contactMode: T }
  >;
};

describe("Convert contact establishment public v1 to domain", () => {
  let establishmentAggregateRepository: InMemoryEstablishmentAggregateRepository;
  let convertContactEstablishmentV1ToDomain: ConvertContactEstablishmentPublicV1ToDomain;

  beforeEach(() => {
    establishmentAggregateRepository =
      new InMemoryEstablishmentAggregateRepository();

    const uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      establishmentAggregateRepository,
    });

    convertContactEstablishmentV1ToDomain =
      new ConvertContactEstablishmentPublicV1ToDomain(uowPerformer);
  });

  it("Throw new error when no establishment aggregate found", async () => {
    const validRequest = makeValidV1ContactRequest("EMAIL");
    await expectPromiseToFailWith(
      convertContactEstablishmentV1ToDomain.execute(validRequest),
      `establishment with siret ${validRequest.siret} not found`,
    );
  });

  it("Throw new error when no offer with matching rome code found", async () => {
    const validRequest = makeValidV1ContactRequest("EMAIL");

    const contact = new ContactEntityBuilder()
      .withId(contactId)
      .withContactMethod("EMAIL")
      .build();

    const immersionOfferWithMismatchingRomeCode =
      new ImmersionOfferEntityV2Builder().withRomeCode("A1234").build();

    await establishmentAggregateRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContact(contact)
        .withImmersionOffers([immersionOfferWithMismatchingRomeCode])
        .build(),
    ]);

    await expectPromiseToFailWith(
      convertContactEstablishmentV1ToDomain.execute(validRequest),
      `Offer with rome code ${validRequest.offer.romeCode} not found for establishment with siret ${validRequest.siret}`,
    );
  });

  it("Convert contact request v1 to domain and add email related values when contact mode is EMAIL", async () => {
    const validV1ContactRequest = makeValidV1ContactRequest("EMAIL");

    const {
      contactMode,
      message,
      potentialBeneficiaryEmail,
      potentialBeneficiaryFirstName,
      potentialBeneficiaryLastName,
      siret,
    } = validV1ContactRequest;

    const contact = new ContactEntityBuilder()
      .withId(contactId)
      .withContactMethod("EMAIL")
      .build();

    await establishmentAggregateRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContact(contact)
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    const contactrequestV1ConvertedToDomain =
      await convertContactEstablishmentV1ToDomain.execute(
        validV1ContactRequest,
      );

    expectToEqual(contactrequestV1ConvertedToDomain, {
      appellationCode: "11704",
      siret,
      potentialBeneficiaryFirstName,
      potentialBeneficiaryLastName,
      potentialBeneficiaryEmail,
      contactMode,
      message,
      potentialBeneficiaryPhone: "Numéro de téléphone non communiqué",
      immersionObjective: null,
    });
  });

  it("Convert contact request v1 to domain when contact methode is IN_PERSON", async () => {
    const validRequest = makeValidV1ContactRequest("IN_PERSON");
    const {
      contactMode,
      potentialBeneficiaryEmail,
      potentialBeneficiaryFirstName,
      potentialBeneficiaryLastName,
      siret,
    } = validRequest;

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

    const contactrequestV1ConvertedToDomain =
      await convertContactEstablishmentV1ToDomain.execute(validRequest);

    expectToEqual(contactrequestV1ConvertedToDomain, {
      appellationCode: "11704",
      siret,
      potentialBeneficiaryFirstName,
      potentialBeneficiaryLastName,
      potentialBeneficiaryEmail,
      contactMode,
    });
  });

  it("Convert contact request v1 to domain when contact methode is PHONE", async () => {
    const validRequest = makeValidV1ContactRequest("PHONE");
    const {
      contactMode,
      potentialBeneficiaryEmail,
      potentialBeneficiaryFirstName,
      potentialBeneficiaryLastName,
      siret,
    } = validRequest;

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

    const contactrequestV1ConvertedToDomain =
      await convertContactEstablishmentV1ToDomain.execute(validRequest);

    expectToEqual(contactrequestV1ConvertedToDomain, {
      appellationCode: "11704",
      siret,
      potentialBeneficiaryFirstName,
      potentialBeneficiaryLastName,
      potentialBeneficiaryEmail,
      contactMode,
    });
  });
});
