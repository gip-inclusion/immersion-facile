import { SuperTest, Test } from "supertest";
import { BasicEventCrawler } from "../../adapters/secondary/core/EventCrawlerImplementations";
import { ContactEstablishmentRequestDto } from "../../shared/contactEstablishment";
import {
  buildTestApp,
  InMemoryRepositories,
} from "../../_testBuilders/buildTestApp";
import { EstablishmentAggregateBuilder } from "../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../_testBuilders/EstablishmentEntityV2Builder";
import { expectArraysToMatch } from "../../_testBuilders/test.helpers";
import { ContactEntityV2Builder } from "../../_testBuilders/ContactEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "../../_testBuilders/ImmersionOfferEntityV2Builder";

const immersionOfferId = "61649067-cd6a-4aa3-8866-d1f3d61292b4";
const siret = "11112222333344";
const contactId = "theContactId";

const validRequest: ContactEstablishmentRequestDto = {
  romeLabel: "My rome label",
  siret,
  contactMode: "EMAIL",
  potentialBeneficiaryFirstName: "potential_beneficiary_first_name",
  potentialBeneficiaryLastName: "potential_beneficiary_last_name",
  potentialBeneficiaryEmail: "potential_beneficiary@email.fr",
  message: "message_to_send",
};

describe("/contact-establishment route", () => {
  let request: SuperTest<Test>;
  let reposAndGateways: InMemoryRepositories;
  let eventCrawler: BasicEventCrawler;

  beforeEach(async () => {
    ({ request, reposAndGateways, eventCrawler } = await buildTestApp());
  });

  it("sends email for valid request", async () => {
    const establishment = new EstablishmentEntityV2Builder()
      .withSiret(siret)
      .build();
    const contact = new ContactEntityV2Builder()
      .withId(contactId)
      .withContactMethod("EMAIL")
      .build();
    const immersionOffer = new ImmersionOfferEntityV2Builder()
      .withId(immersionOfferId)
      .build();

    await reposAndGateways.immersionOffer.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContact(contact)
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    await request.post(`/contact-establishment`).send(validRequest).expect(200);

    expectArraysToMatch(reposAndGateways.outbox.events, [
      {
        topic: "ContactRequestedByBeneficiary",
        payload: validRequest,
      },
    ]);

    await eventCrawler.processNewEvents();
    expect(reposAndGateways.email.getSentEmails()).toHaveLength(1);
    expect(reposAndGateways.email.getSentEmails()[0].type).toBe(
      "CONTACT_BY_EMAIL_REQUEST",
    );
  });

  it("fails with 404 for unknown siret", async () => {
    const response = await request.post(`/contact-establishment`).send({
      ...validRequest,
      siret: "40400040000404",
    });

    expect(response.body).toEqual({ errors: 40400040000404 });
    expect(response.status).toBe(404);
  });

  it("fails with 400 for invalid requests", async () => {
    await request
      .post(`/contact-establishment`)
      .send({ not_a: "valid_request" })
      .expect(400);
  });
});
