import { createInMemoryUow } from "../../../adapters/primary/config";
import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersionOfferRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { UnitOfWorkPerformer } from "../../../domain/core/ports/UnitOfWork";
import { ContactEstablishment } from "../../../domain/immersionOffer/useCases/ContactEstablishment";
import { ContactEstablishmentRequestDto } from "../../../shared/contactEstablishment";
import { ContactEntityV2Builder } from "../../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../../_testBuilders/EstablishmentEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import {
  expectArraysToEqual,
  expectPromiseToFailWithError,
} from "../../../_testBuilders/test.helpers";

const contact = new ContactEntityV2Builder().build();
const immersionOffer = new ImmersionOfferEntityV2Builder().build();

const validRequest: ContactEstablishmentRequestDto = {
  immersionOfferId: immersionOffer.id,
  contactMode: "PHONE",
  potentialBeneficiaryFirstName: "potential_beneficiary_first_name",
  potentialBeneficiaryLastName: "potential_beneficiary_last_name",
  potentialBeneficiaryEmail: "potential_beneficiary@email.fr",
};

describe("ContactEstablishment", () => {
  let contactEstablishment: ContactEstablishment;
  let immersionOfferRepository: InMemoryImmersionOfferRepository;
  let outboxRepository: InMemoryOutboxRepository;
  let uowPerformer: UnitOfWorkPerformer;
  let uuidGenerator: TestUuidGenerator;
  let clock: CustomClock;

  beforeEach(() => {
    immersionOfferRepository = new InMemoryImmersionOfferRepository();
    outboxRepository = new InMemoryOutboxRepository();
    uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      immersionOfferRepo: immersionOfferRepository,
      outboxRepo: outboxRepository,
    });
    clock = new CustomClock();
    uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

    contactEstablishment = new ContactEstablishment(
      uowPerformer,
      createNewEvent,
    );
  });

  test("schedules event for valid contact request", async () => {
    await immersionOfferRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(new EstablishmentEntityV2Builder().build())
        .withContact(
          new ContactEntityV2Builder().withContactMethod("EMAIL").build(),
        )
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    const eventId = "event_id";
    uuidGenerator.setNextUuid(eventId);

    const now = new Date("2021-12-08T15:00");
    clock.setNextDate(now);

    const validEmailRequest: ContactEstablishmentRequestDto = {
      ...validRequest,
      contactMode: "EMAIL",
      message: "message_to_send",
    };
    await contactEstablishment.execute(validEmailRequest);

    expectArraysToEqual(outboxRepository.events, [
      {
        id: eventId,
        occurredAt: now.toISOString(),
        topic: "ContactRequestedByBeneficiary",
        wasPublished: false,
        wasQuarantined: false,
        payload: validEmailRequest,
      },
    ]);
  });

  test("schedules event for valid PHONE contact request", async () => {
    await immersionOfferRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(new EstablishmentEntityV2Builder().build())
        .withContact(
          new ContactEntityV2Builder().withContactMethod("PHONE").build(),
        )
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    const eventId = "event_id";
    uuidGenerator.setNextUuid(eventId);

    const now = new Date("2021-12-08T15:00");
    clock.setNextDate(now);

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
        wasPublished: false,
        wasQuarantined: false,
        payload: validPhoneRequest,
      },
    ]);
  });

  test("schedules event for valid IN_PERSON contact requests", async () => {
    await immersionOfferRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(new EstablishmentEntityV2Builder().build())
        .withContact(
          new ContactEntityV2Builder().withContactMethod("IN_PERSON").build(),
        )
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    const eventId = "event_id";
    uuidGenerator.setNextUuid(eventId);

    const now = new Date("2021-12-08T15:00");
    clock.setNextDate(now);

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
        wasPublished: false,
        wasQuarantined: false,
        payload: validInPersonRequest,
      },
    ]);
  });

  test("throws NotFoundError for missing immersion offer", async () => {
    // No immersion offer

    await expectPromiseToFailWithError(
      contactEstablishment.execute({
        ...validRequest,
        contactMode: "PHONE",
        immersionOfferId: "missing_offer_id",
      }),
      new NotFoundError("missing_offer_id"),
    );
  });

  test("throws BadRequestError for contact mode mismatch", async () => {
    await immersionOfferRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(new EstablishmentEntityV2Builder().build())
        .withContact(
          new ContactEntityV2Builder().withContactMethod("EMAIL").build(),
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
        `Contact mode mismatch: IN_PERSON in immersion offer: ${immersionOffer.id}`,
      ),
    );
  });

  test("throws BadRequestError immersion offer without contact id", async () => {
    await immersionOfferRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(new EstablishmentEntityV2Builder().build())
        .withoutContact() // no contact
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    await expectPromiseToFailWithError(
      contactEstablishment.execute({
        ...validRequest,
        contactMode: "PHONE",
      }),
      new BadRequestError(
        `No contact for immersion offer: ${immersionOffer.id}`,
      ),
    );
  });
});
