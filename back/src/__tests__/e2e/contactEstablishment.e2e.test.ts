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
import { ContactEntityV2Builder } from "./../../_testBuilders/ContactEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "./../../_testBuilders/ImmersionOfferEntityV2Builder";

const immersionOfferId = "61649067-cd6a-4aa3-8866-d1f3d61292b4";
const validRequest: ContactEstablishmentRequestDto = {
  immersionOfferId,
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

  test("sends email for valid request", async () => {
    const establishment = new EstablishmentEntityV2Builder()
      .withContactMode("EMAIL")
      .build();
    const contact = new ContactEntityV2Builder().build();
    const immersionOffer = new ImmersionOfferEntityV2Builder()
      .withId(immersionOfferId)
      .build();

    await reposAndGateways.immersionOffer.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContacts([contact])
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    const contactEstablishmentRequest = {
      ...validRequest,
      immersionOfferId,
    };

    await request
      .post(`/contact-establishment`)
      .send(contactEstablishmentRequest)
      .expect(200);

    expectArraysToMatch(reposAndGateways.outbox.events, [
      {
        topic: "ContactRequestedByBeneficiary",
        payload: contactEstablishmentRequest,
      },
    ]);

    await eventCrawler.processEvents();
    expect(reposAndGateways.email.getSentEmails()).toHaveLength(1);
    expect(reposAndGateways.email.getSentEmails()[0].type).toEqual(
      "CONTACT_BY_EMAIL_REQUEST",
    );
  });

  test("fails with 404 for unknown immersion offers", async () => {
    await request
      .post(`/contact-establishment`)
      .send({
        ...validRequest,
        immersionOfferId: "unknown-immersion-offer-id",
      })
      .expect(404);
  });

  test("fails with 400 for invalid requests", async () => {
    await request
      .post(`/contact-establishment`)
      .send({ not_a: "valid_request" })
      .expect(400);
  });
});
