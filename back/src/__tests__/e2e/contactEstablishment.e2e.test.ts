import { SuperTest, Test } from "supertest";
import {
  buildTestApp,
  InMemoryRepositories,
} from "../../_testBuilders/buildTestApp";
import { expectArraysToMatch } from "../../_testBuilders/test.helpers";
import { BasicEventCrawler } from "../../adapters/secondary/core/EventCrawlerImplementations";
import { validImmersionOfferId } from "../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { ContactEstablishmentRequestDto } from "../../shared/contactEstablishment";

const validRequest: ContactEstablishmentRequestDto = {
  immersionOfferId: validImmersionOfferId,
  contactMode: "EMAIL",
  senderName: "sender_name",
  senderEmail: "sender@email.fr",
  message: "message_to_send",
};

describe("/contact-establishment route", () => {
  let request: SuperTest<Test>;
  let reposAndGateways: InMemoryRepositories;
  let eventCrawler: BasicEventCrawler;

  beforeEach(async () => {
    ({ request, reposAndGateways, eventCrawler } = await buildTestApp());
  });

  test("succeeds for valid request of contact by Email", async () => {
    const response = await request
      .post(`/contact-establishment`)
      .send(validRequest);

    expect(response.status).toBe(200);

    expectArraysToMatch(reposAndGateways.outbox.events, [
      { topic: "ContactRequestedByBeneficiary", payload: validRequest },
    ]);

    // TODO: check email are sent when NotifyEstablishmentOfContactRequest use case is implemented
    // await eventCrawler.processEvents();
    // const expectedEmail: TemplatedEmail = {
    //   type: "",
    //   recipients: [],
    // };
    // expect(reposAndGateways.email.getSentEmails()).toEqual([expectedEmail]);
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
