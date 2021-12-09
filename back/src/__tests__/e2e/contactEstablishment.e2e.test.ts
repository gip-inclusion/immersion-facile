import supertest, { SuperTest, Test } from "supertest";
import { createApp } from "../../adapters/primary/server";
import { validImmersionOfferId } from "../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { ContactEstablishmentRequestDto } from "../../shared/contactEstablishment";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";

const validRequest: ContactEstablishmentRequestDto = {
  immersionOfferId: validImmersionOfferId,
  contactMode: "EMAIL",
  senderName: "sender_name",
  senderEmail: "sender@email.fr",
  message: "message_to_send",
};

describe("/contact-establishment route", () => {
  let request: SuperTest<Test>;

  beforeEach(async () => {
    request = supertest(await createApp(new AppConfigBuilder().build()));
  });

  test("succeeds for valid request", async () => {
    await request.post(`/contact-establishment`).send(validRequest).expect(200);
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
