import {
  ContactEstablishmentRequestDto,
  expectArraysToEqual,
  expectPromiseToFailWithError,
} from "shared";
import { ContactEntityBuilder } from "../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryEstablishmentAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { UnitOfWorkPerformer } from "../../../domain/core/ports/UnitOfWork";
import { ContactEstablishment } from "../../../domain/immersionOffer/useCases/ContactEstablishment";

const immersionOffer = new ImmersionOfferEntityV2Builder().build();
const siret = "11112222333344";
const contactId = "theContactId";

const validRequest: ContactEstablishmentRequestDto = {
  appellationCode: "12898",
  siret,
  contactMode: "PHONE",
  potentialBeneficiaryFirstName: "potential_beneficiary_first_name",
  potentialBeneficiaryLastName: "potential_beneficiary_last_name",
  potentialBeneficiaryEmail: "potential_beneficiary@email.fr",
};

describe("ContactEstablishment", () => {
  let contactEstablishment: ContactEstablishment;
  let establishmentAggregateRepository: InMemoryEstablishmentAggregateRepository;
  let outboxRepository: InMemoryOutboxRepository;
  let uowPerformer: UnitOfWorkPerformer;
  let uuidGenerator: TestUuidGenerator;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    establishmentAggregateRepository =
      new InMemoryEstablishmentAggregateRepository();
    outboxRepository = new InMemoryOutboxRepository();
    uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      establishmentAggregateRepository,
      outboxRepository,
    });
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({
      timeGateway,
      uuidGenerator,
    });

    contactEstablishment = new ContactEstablishment(
      uowPerformer,
      createNewEvent,
    );
  });

  it("schedules event for valid contact request", async () => {
    await establishmentAggregateRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityBuilder().withSiret(siret).build(),
        )
        .withContact(
          new ContactEntityBuilder()
            .withId(contactId)
            .withContactMethod("EMAIL")
            .build(),
        )
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    const eventId = "event_id";
    uuidGenerator.setNextUuid(eventId);

    const now = new Date("2021-12-08T15:00");
    timeGateway.setNextDate(now);

    const validEmailRequest: ContactEstablishmentRequestDto = {
      ...validRequest,
      contactMode: "EMAIL",
      message: "message_to_send",
      immersionObjective: "Confirmer un projet professionnel",
      potentialBeneficiaryPhone: "0654783402",
    };
    await contactEstablishment.execute(validEmailRequest);

    expectArraysToEqual(outboxRepository.events, [
      {
        id: eventId,
        occurredAt: now.toISOString(),
        topic: "ContactRequestedByBeneficiary",
        payload: validEmailRequest,
        publications: [],
        wasQuarantined: false,
      },
    ]);
  });

  it("schedules event for valid PHONE contact request", async () => {
    await establishmentAggregateRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityBuilder().withSiret(siret).build(),
        )
        .withContact(
          new ContactEntityBuilder()
            .withId(contactId)
            .withContactMethod("PHONE")
            .build(),
        )
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    const eventId = "event_id";
    uuidGenerator.setNextUuid(eventId);

    const now = new Date("2021-12-08T15:00");
    timeGateway.setNextDate(now);

    const validPhoneRequest: ContactEstablishmentRequestDto = {
      ...validRequest,
      contactMode: "PHONE",
    };
    await contactEstablishment.execute(validPhoneRequest);

    expectArraysToEqual(outboxRepository.events, [
      {
        id: eventId,
        occurredAt: now.toISOString(),
        topic: "ContactRequestedByBeneficiary",
        payload: validPhoneRequest,
        publications: [],
        wasQuarantined: false,
      },
    ]);
  });

  it("schedules event for valid IN_PERSON contact requests", async () => {
    await establishmentAggregateRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityBuilder().withSiret(siret).build(),
        )
        .withContact(
          new ContactEntityBuilder()
            .withId(contactId)
            .withContactMethod("IN_PERSON")
            .build(),
        )
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    const eventId = "event_id";
    uuidGenerator.setNextUuid(eventId);

    const now = new Date("2021-12-08T15:00");
    timeGateway.setNextDate(now);

    const validInPersonRequest: ContactEstablishmentRequestDto = {
      ...validRequest,
      contactMode: "IN_PERSON",
    };
    await contactEstablishment.execute(validInPersonRequest);

    expectArraysToEqual(outboxRepository.events, [
      {
        id: eventId,
        occurredAt: now.toISOString(),
        topic: "ContactRequestedByBeneficiary",
        payload: validInPersonRequest,
        publications: [],
        wasQuarantined: false,
      },
    ]);
  });

  it("throws BadRequestError for contact mode mismatch", async () => {
    await establishmentAggregateRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityBuilder().withSiret(siret).build(),
        )
        .withContact(
          new ContactEntityBuilder()
            .withId("wrong_contact_id")
            .withContactMethod("EMAIL")
            .build(),
        )
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    await expectPromiseToFailWithError(
      contactEstablishment.execute({
        ...validRequest,
        contactMode: "IN_PERSON",
      }),
      new BadRequestError(
        "Contact mode mismatch: IN_PERSON in params. In contact (fetched with siret) : EMAIL",
      ),
    );
  });

  it("throws BadRequestError immersion offer without contact id", async () => {
    await establishmentAggregateRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityBuilder().withSiret(siret).build(),
        )
        .withoutContact() // no contact
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    await expectPromiseToFailWithError(
      contactEstablishment.execute({
        ...validRequest,
        contactMode: "PHONE",
      }),
      new BadRequestError(`No contact for establishment: 11112222333344`),
    );
  });
});
