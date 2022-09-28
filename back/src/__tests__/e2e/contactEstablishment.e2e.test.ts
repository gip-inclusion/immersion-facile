import { ContactEstablishmentRequestDto } from "shared";
import { SuperTest, Test } from "supertest";
import {
  buildTestApp,
  InMemoryGateways,
} from "../../_testBuilders/buildTestApp";
import { ContactEntityV2Builder } from "../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../_testBuilders/EstablishmentEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "../../_testBuilders/ImmersionOfferEntityV2Builder";
import { expectArraysToMatch } from "../../_testBuilders/test.helpers";
import { InMemoryUnitOfWork } from "../../adapters/primary/config/uowConfig";
import { BasicEventCrawler } from "../../adapters/secondary/core/EventCrawlerImplementations";

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
  let gateways: InMemoryGateways;
  let eventCrawler: BasicEventCrawler;
  let inMemoryUow: InMemoryUnitOfWork;

  beforeEach(async () => {
    ({ request, gateways, eventCrawler, inMemoryUow } = await buildTestApp());
  });

  it("sends email for valid request", async () => {
    const establishment = new EstablishmentEntityV2Builder()
      .withSiret(siret)
      .build();
    const contact = new ContactEntityV2Builder()
      .withId(contactId)
      .withContactMethod("EMAIL")
      .build();
    const immersionOffer = new ImmersionOfferEntityV2Builder().build();

    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
      [
        new EstablishmentAggregateBuilder()
          .withEstablishment(establishment)
          .withContact(contact)
          .withImmersionOffers([immersionOffer])
          .build(),
      ],
    );

    await request.post(`/contact-establishment`).send(validRequest).expect(200);

    expectArraysToMatch(inMemoryUow.outboxRepository.events, [
      {
        topic: "ContactRequestedByBeneficiary",
        payload: validRequest,
      },
    ]);

    await eventCrawler.processNewEvents();
    expect(gateways.email.getSentEmails()).toHaveLength(1);
    expect(gateways.email.getSentEmails()[0].type).toBe(
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
