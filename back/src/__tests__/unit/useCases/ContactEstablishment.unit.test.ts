import { createInMemoryUow } from "../../../adapters/primary/config";
import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { UnitOfWorkPerformer } from "../../../domain/core/ports/UnitOfWork";
import { ContactEstablishment } from "../../../domain/immersionOffer/useCases/ContactEstablishment";
import { ContactEstablishmentRequestDto } from "../../../shared/contactEstablishment";
import { ImmersionEstablishmentContactBuilder } from "../../../_testBuilders/ImmersionEstablishmentContactBuilder";
import { ImmersionOfferEntityBuilder } from "../../../_testBuilders/ImmersionOfferEntityBuilder";
import {
  expectArraysToEqual,
  expectArraysToMatch,
  expectPromiseToFailWithError,
} from "../../../_testBuilders/test.helpers";
import { BadRequestError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";

const establishment = new EstablishmentEntityBuilder().build();
const establishmentContact = new ImmersionEstablishmentContactBuilder()
  .withSiret(establishment.getSiret())
  .build();
const immersionOffer = new ImmersionOfferEntityBuilder()
  .withSiret(establishment.getSiret())
  .withContactInEstablishment(establishmentContact)
  .build();

const validEmailRequest: ContactEstablishmentRequestDto = {
  immersionOfferId: immersionOffer.getId(),
  contactMode: "EMAIL",
  senderName: "sender_name",
  senderEmail: "sender@email.fr",
  message: "message_to_send",
};

const validPhoneRequest: ContactEstablishmentRequestDto = {
  immersionOfferId: immersionOffer.getId(),
  contactMode: "PHONE",
  senderName: "My name",
  senderEmail: "askingForPhone@email.fr",
};

describe("ContactEstablishment", () => {
  let contactEstablishment: ContactEstablishment;
  let immersionOfferRepository: InMemoryImmersionOfferRepository;
  let outboxRepository: InMemoryOutboxRepository;
  let uowPerformer: UnitOfWorkPerformer;
  let uuidGenerator: TestUuidGenerator;
  let clock: CustomClock;

  beforeEach(() => {
    immersionOfferRepository = new InMemoryImmersionOfferRepository().empty();
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

  test("schedules event for valid EMAIL contact request", async () => {
    await immersionOfferRepository.insertEstablishments([establishment]);
    await immersionOfferRepository.insertEstablishmentContact(
      establishmentContact,
    );
    await immersionOfferRepository.insertImmersions([immersionOffer]);

    const eventId = "event_id";
    uuidGenerator.setNextUuid(eventId);

    const now = new Date("2021-12-08T15:00");
    clock.setNextDate(now);

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
    const establishmentContactByPhone = new EstablishmentEntityBuilder(
      establishment,
    )
      .withContactMode("PHONE")
      .build();

    await immersionOfferRepository.insertEstablishments([
      establishmentContactByPhone,
    ]);
    await immersionOfferRepository.insertEstablishmentContact(
      establishmentContact,
    );
    await immersionOfferRepository.insertImmersions([immersionOffer]);

    const eventId = "event_id";
    uuidGenerator.setNextUuid(eventId);

    const now = new Date("2021-12-08T15:00");
    clock.setNextDate(now);

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

  test("schedules no event for valid IN_PERSON contact requests", async () => {
    await immersionOfferRepository.insertEstablishments([
      new EstablishmentEntityBuilder(establishment)
        .withContactMode("IN_PERSON")
        .build(),
    ]);
    await immersionOfferRepository.insertEstablishmentContact(
      establishmentContact,
    );
    await immersionOfferRepository.insertImmersions([immersionOffer]);

    await contactEstablishment.execute({
      ...validEmailRequest,
      contactMode: "IN_PERSON",
    });

    expect(outboxRepository.events).toHaveLength(0);
  });

  test("throws NotFoundError for missing immersion offer", async () => {
    // No immersion offer

    await expectPromiseToFailWithError(
      contactEstablishment.execute({
        ...validEmailRequest,
        immersionOfferId: "missing_offer_id",
      }),
      new NotFoundError("missing_offer_id"),
    );
  });

  test("throws BadRequestError for contact mode mismatch", async () => {
    await immersionOfferRepository.insertEstablishments([
      new EstablishmentEntityBuilder(establishment)
        .withContactMode("PHONE")
        .build(),
    ]);
    await immersionOfferRepository.insertEstablishmentContact(
      establishmentContact,
    );
    await immersionOfferRepository.insertImmersions([immersionOffer]);

    await expectPromiseToFailWithError(
      contactEstablishment.execute({
        ...validEmailRequest,
        contactMode: "IN_PERSON",
      }),
      new BadRequestError(
        `contact mode mismatch: IN_PERSON in immersion offer: ${validEmailRequest.immersionOfferId}`,
      ),
    );
  });

  test("throws BadRequestError immersion offer without contact id", async () => {
    await immersionOfferRepository.insertEstablishments([establishment]);
    await immersionOfferRepository.insertImmersions([
      new ImmersionOfferEntityBuilder(immersionOffer.getProps())
        .clearContactInEstablishment()
        .build(),
    ]);

    await expectPromiseToFailWithError(
      contactEstablishment.execute(validEmailRequest),
      new BadRequestError(
        `no contact id in immersion offer: ${validEmailRequest.immersionOfferId}`,
      ),
    );
  });
});
