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
import { makeCreateInMemoryUow } from "../../../_testBuilders/makeCreateInMemoryUow";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { BadRequestError } from "./../../../adapters/primary/helpers/sendHttpResponse";
import { EstablishmentEntityBuilder } from "./../../../_testBuilders/EstablishmentEntityBuilder";

const establishment = new EstablishmentEntityBuilder().build();
const establishmentContact = new ImmersionEstablishmentContactBuilder()
  .withSiret(establishment.getSiret())
  .build();
const immersionOffer = new ImmersionOfferEntityBuilder()
  .withSiret(establishment.getSiret())
  .withContactInEstablishment(establishmentContact)
  .build();

const validRequest: ContactEstablishmentRequestDto = {
  immersionOfferId: immersionOffer.getId(),
  contactMode: "EMAIL",
  senderName: "sender_name",
  senderEmail: "sender@email.fr",
  message: "message_to_send",
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
    uowPerformer = new InMemoryUowPerformer(
      makeCreateInMemoryUow({
        immersionOfferRepo: immersionOfferRepository,
        outboxRepo: outboxRepository,
      }),
    );
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

    await contactEstablishment.execute(validRequest);

    expect(outboxRepository.events).toEqual([
      {
        id: eventId,
        occurredAt: now.toISOString(),
        topic: "EmailContactRequestedByBeneficiary",
        wasPublished: false,
        wasQuarantined: false,
        payload: validRequest,
      },
    ]);
  });

  test("schedules no event for valid PHONE contact requests", async () => {
    await immersionOfferRepository.insertEstablishments([
      new EstablishmentEntityBuilder(establishment)
        .withContactMode("PHONE")
        .build(),
    ]);
    await immersionOfferRepository.insertEstablishmentContact(
      establishmentContact,
    );
    await immersionOfferRepository.insertImmersions([immersionOffer]);

    await contactEstablishment.execute({
      ...validRequest,
      contactMode: "PHONE",
    });

    expect(outboxRepository.events).toHaveLength(0);
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
      ...validRequest,
      contactMode: "IN_PERSON",
    });

    expect(outboxRepository.events).toHaveLength(0);
  });

  test("throws NotFoundError for missing immersion offer", async () => {
    // No immersion offer

    await expectPromiseToFailWithError(
      contactEstablishment.execute({
        ...validRequest,
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
        ...validRequest,
        contactMode: "IN_PERSON",
      }),
      new BadRequestError(
        `contact mode mismatch: IN_PERSON in immersion offer: ${validRequest.immersionOfferId}`,
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
      contactEstablishment.execute(validRequest),
      new BadRequestError(
        `no contact id in immersion offer: ${validRequest.immersionOfferId}`,
      ),
    );
  });
});
