import { SuperTest, Test } from "supertest";
import {
  ContactEstablishmentRequestDto,
  contactEstablishmentRoute,
  expectArraysToMatch,
} from "shared";
import {
  buildTestApp,
  InMemoryGateways,
} from "../../../../_testBuilders/buildTestApp";
import { ContactEntityBuilder } from "../../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityBuilder } from "../../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { processEventsForEmailToBeSent } from "../../../../_testBuilders/processEventsForEmailToBeSent";
import { BasicEventCrawler } from "../../../secondary/core/EventCrawlerImplementations";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

const siret = "11112222333344";
const contactId = "theContactId";

const validRequest: ContactEstablishmentRequestDto = {
  offer: { romeLabel: "Stylisme", romeCode: "B1805" },
  siret,
  contactMode: "EMAIL",
  potentialBeneficiaryFirstName: "potential_beneficiary_first_name",
  potentialBeneficiaryLastName: "potential_beneficiary_last_name",
  potentialBeneficiaryEmail: "potential_beneficiary@email.fr",
  message: "message_to_send",
  immersionObjective: "Confirmer un projet professionnel",
  potentialBeneficiaryPhone: "0654783402",
};

describe(`/${contactEstablishmentRoute} route`, () => {
  let request: SuperTest<Test>;
  let gateways: InMemoryGateways;
  let eventCrawler: BasicEventCrawler;
  let inMemoryUow: InMemoryUnitOfWork;

  beforeEach(async () => {
    ({ request, gateways, eventCrawler, inMemoryUow } = await buildTestApp());
  });

  it("sends email for valid request and save the discussion", async () => {
    const establishment = new EstablishmentEntityBuilder()
      .withSiret(siret)
      .build();
    const contact = new ContactEntityBuilder()
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

    await request
      .post(`/${contactEstablishmentRoute}`)
      .send(validRequest)
      .expect(200);

    expectArraysToMatch(inMemoryUow.outboxRepository.events, [
      {
        topic: "ContactRequestedByBeneficiary",
        payload: validRequest,
      },
    ]);

    await processEventsForEmailToBeSent(eventCrawler);
    expect(gateways.notification.getSentEmails()).toHaveLength(1);
    expect(gateways.notification.getSentEmails()[0].kind).toBe(
      "CONTACT_BY_EMAIL_REQUEST",
    );

    expect(
      inMemoryUow.discussionAggregateRepository.discussionAggregates,
    ).toHaveLength(1);
  });

  it("fails with 404 for unknown siret", async () => {
    const response = await request.post(`/${contactEstablishmentRoute}`).send({
      ...validRequest,
      siret: "40400040000404",
    });

    expect(response.body).toEqual({ errors: 40400040000404 });
    expect(response.status).toBe(404);
  });

  it("fails with 400 for invalid requests", async () => {
    await request
      .post(`/${contactEstablishmentRoute}`)
      .send({ not_a: "valid_request" })
      .expect(400);
  });
});
