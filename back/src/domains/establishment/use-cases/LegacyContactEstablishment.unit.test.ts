import { addHours } from "date-fns";
import subDays from "date-fns/subDays";
import {
  AppellationAndRomeDto,
  ContactEstablishmentRequestDto,
  DiscussionBuilder,
  LegacyContactEstablishmentRequestDto,
  Location,
  expectArraysToEqual,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../../config/helpers/httpErrors";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
} from "../helpers/EstablishmentBuilders";
import { LegacyContactEstablishment } from "./LegacyContactEstablishment";

const siret = "11112222333344";
const contactId = "theContactId";

const location: Location = {
  id: "11111111-1111-4444-1111-111111111111",
  address: {
    streetNumberAndAddress: "24 rue des bouchers",
    city: "Strasbourg",
    postcode: "67000",
    departmentCode: "67",
  },
  position: {
    lat: 48.584614,
    lon: 7.750712,
  },
};

const validRequest: ContactEstablishmentRequestDto = {
  appellationCode: "12898",
  siret,
  contactMode: "PHONE",
  potentialBeneficiaryFirstName: "potential_beneficiary_first_name",
  potentialBeneficiaryLastName: "potential_beneficiary_last_name",
  potentialBeneficiaryEmail: "potential_beneficiary@email.fr",
  locationId: location.id,
};

const appellationAndRome: AppellationAndRomeDto = {
  appellationCode: validRequest.appellationCode,
  appellationLabel: "My appellation label",
  romeCode: "A0000",
  romeLabel: "Rome de test",
};

const immersionOffer = new OfferEntityBuilder()
  .withRomeCode(appellationAndRome.romeCode)
  .withAppellationCode(validRequest.appellationCode)
  .withAppellationLabel(appellationAndRome.appellationLabel)
  .build();

const validEmailRequest: LegacyContactEstablishmentRequestDto = {
  ...validRequest,
  contactMode: "EMAIL",
  message: "message_to_send",
  immersionObjective: "Confirmer un projet professionnel",
  potentialBeneficiaryPhone: "+33654783402",
};

const establishmentAggregateWithEmailContact =
  new EstablishmentAggregateBuilder()
    .withEstablishment(
      new EstablishmentEntityBuilder()
        .withSiret(siret)
        .withLocations([location])
        .build(),
    )
    .withContact(
      new ContactEntityBuilder()
        .withId(contactId)
        .withContactMethod("EMAIL")
        .build(),
    )
    .withOffers([immersionOffer]);

const minimumNumberOfDaysBetweenSimilarContactRequests = 3;

describe("ContactEstablishment", () => {
  let contactEstablishment: LegacyContactEstablishment;
  let uowPerformer: UnitOfWorkPerformer;
  let uuidGenerator: TestUuidGenerator;
  let timeGateway: CustomTimeGateway;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    uowPerformer = new InMemoryUowPerformer(uow);
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    uow.romeRepository.appellations = [appellationAndRome];
    const createNewEvent = makeCreateNewEvent({
      timeGateway,
      uuidGenerator,
    });

    contactEstablishment = new LegacyContactEstablishment(
      uowPerformer,
      createNewEvent,
      uuidGenerator,
      timeGateway,
      minimumNumberOfDaysBetweenSimilarContactRequests,
    );
  });

  it("schedules event for valid EMAIL contact request", async () => {
    await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
      establishmentAggregateWithEmailContact.build(),
    );

    const discussionId = "discussion_id";
    const eventId = "contact_event_id";
    uuidGenerator.setNextUuids([discussionId, eventId]);

    const now = new Date("2021-12-08T15:00");
    timeGateway.setNextDates([now, now]);

    await contactEstablishment.execute(validEmailRequest);

    expectArraysToEqual(uow.outboxRepository.events, [
      {
        id: eventId,
        occurredAt: now.toISOString(),
        topic: "ContactRequestedByBeneficiary",
        payload: { ...validEmailRequest, discussionId, triggeredBy: undefined },
        status: "never-published",
        publications: [],
        wasQuarantined: false,
      },
    ]);
  });

  it("schedules event for valid PHONE contact request", async () => {
    await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityBuilder()
            .withSiret(siret)
            .withLocations([location])
            .build(),
        )
        .withContact(
          new ContactEntityBuilder()
            .withId(contactId)
            .withContactMethod("PHONE")
            .build(),
        )
        .withOffers([immersionOffer])
        .build(),
    );

    const discussionId = "discussion_id";
    const eventId = "contact_event_id";
    uuidGenerator.setNextUuids([discussionId, eventId]);

    const now = new Date("2021-12-08T15:00");
    timeGateway.setNextDates([now, now]);

    const validPhoneRequest: LegacyContactEstablishmentRequestDto = {
      ...validRequest,
      contactMode: "PHONE",
    };
    await contactEstablishment.execute(validPhoneRequest);

    expectArraysToEqual(uow.outboxRepository.events, [
      {
        id: eventId,
        occurredAt: now.toISOString(),
        topic: "ContactRequestedByBeneficiary",
        payload: { ...validPhoneRequest, discussionId, triggeredBy: undefined },
        publications: [],
        status: "never-published",
        wasQuarantined: false,
      },
    ]);
  });

  it("schedules event for valid IN_PERSON contact requests", async () => {
    await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityBuilder()
            .withSiret(siret)
            .withLocations([location])
            .build(),
        )
        .withContact(
          new ContactEntityBuilder()
            .withId(contactId)
            .withContactMethod("IN_PERSON")
            .build(),
        )
        .withOffers([immersionOffer])
        .build(),
    );

    const discussionId = "discussion_id";
    const eventId = "contact_event_id";
    uuidGenerator.setNextUuids([discussionId, eventId]);

    const now = new Date("2021-12-08T15:00");
    timeGateway.setNextDates([now, now]);

    const validInPersonRequest: LegacyContactEstablishmentRequestDto = {
      ...validRequest,
      contactMode: "IN_PERSON",
    };
    await contactEstablishment.execute(validInPersonRequest);

    expectArraysToEqual(uow.outboxRepository.events, [
      {
        id: eventId,
        occurredAt: now.toISOString(),
        topic: "ContactRequestedByBeneficiary",
        payload: {
          ...validInPersonRequest,
          discussionId,
          triggeredBy: undefined,
        },
        publications: [],
        status: "never-published",
        wasQuarantined: false,
      },
    ]);
  });

  it("creates a Discussion Aggregate and adds in to repo", async () => {
    // Prepare
    const establishmentAggregate =
      establishmentAggregateWithEmailContact.build();
    await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
      establishmentAggregate,
    );
    const establishment = establishmentAggregate.establishment;
    // biome-ignore lint/style/noNonNullAssertion: we know the contact is defined
    const establishmentContact = establishmentAggregate.contact!;

    const connectionDate = new Date("2022-01-01T12:00:00.000");
    const connectionDateStr = connectionDate.toISOString();
    timeGateway.setNextDate(connectionDate);

    const discussionId = "someDiscussionUuid";
    uuidGenerator.setNextUuid(discussionId);

    await contactEstablishment.execute(validEmailRequest);

    // Assert
    expectToEqual(uow.discussionRepository.discussions, [
      {
        id: discussionId,
        appellationCode: "12898",
        siret: validEmailRequest.siret,
        businessName: "Company inside repository",
        address: establishment.locations[0].address,
        potentialBeneficiary: {
          firstName: validEmailRequest.potentialBeneficiaryFirstName,
          lastName: validEmailRequest.potentialBeneficiaryLastName,
          email: validEmailRequest.potentialBeneficiaryEmail,
          phone: validEmailRequest.potentialBeneficiaryPhone,
          resumeLink: validEmailRequest.potentialBeneficiaryResumeLink,
        },
        establishmentContact: {
          contactMethod: "EMAIL",
          email: establishmentContact.email,
          firstName: establishmentContact.firstName,
          lastName: establishmentContact.lastName,
          phone: establishmentContact.phone,
          job: establishmentContact.job,
          copyEmails: establishmentContact.copyEmails,
        },
        createdAt: connectionDateStr,
        immersionObjective: "Confirmer un projet professionnel",
        exchanges: [
          {
            subject: "Demande de contact initiée par le bénéficiaire",
            sentAt: connectionDateStr,
            message: validEmailRequest.message,
            recipient: "establishment",
            sender: "potentialBeneficiary",
          },
        ],
      },
    ]);
  });

  it("switches establishment is searchable to false when the max contacts per week is reached", async () => {
    // préparation
    const establishmentAggregate = establishmentAggregateWithEmailContact
      .withIsSearchable(true)
      .withMaxContactsPerWeek(2)
      .withOffers([immersionOffer])
      .build();
    await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
      establishmentAggregate,
    );
    const establishment = establishmentAggregate.establishment;
    // biome-ignore lint/style/noNonNullAssertion: we know the contact is defined
    const establishmentContact = establishmentAggregate.contact!;

    const connectionDate = new Date("2022-01-10T12:00:00.000");
    timeGateway.setNextDate(connectionDate);

    const discussion1Date = new Date("2022-01-09T12:00:00.000").toISOString();
    const discussionToOldDate = new Date(
      "2022-01-02T12:00:00.000",
    ).toISOString();
    uow.discussionRepository.discussions = [
      {
        id: "discussionToOld",
        appellationCode: appellationAndRome.appellationCode,
        siret,
        businessName: "Entreprise 1",
        address: establishment.locations[0].address,
        immersionObjective: "Confirmer un projet professionnel",
        potentialBeneficiary: {
          firstName: "Antoine",
          lastName: "Tourasse",
          email: "antoine.tourasse@email.com",
          phone: "+33654783402",
          resumeLink: "http://fakelink.com",
        },
        establishmentContact: {
          contactMethod: "EMAIL",
          email: establishmentContact.email,
          firstName: establishmentContact.firstName,
          lastName: establishmentContact.lastName,
          phone: establishmentContact.phone,
          job: establishmentContact.job,
          copyEmails: establishmentContact.copyEmails,
        },
        createdAt: discussionToOldDate,
        exchanges: [
          {
            subject: "Demande de contact initiée par le bénéficiaire",
            message: "Bonjour, c'est une vieille disucssion",
            recipient: "establishment",
            sender: "potentialBeneficiary",
            sentAt: discussionToOldDate,
          },
        ],
      },
      {
        id: "discussion1",
        appellationCode: appellationAndRome.appellationCode,
        createdAt: discussion1Date,
        siret,
        businessName: "Entreprise 2",
        address: establishment.locations[0].address,
        potentialBeneficiary: {
          firstName: "Antoine",
          lastName: "Tourasse",
          email: "antoine.tourasse@email.com",
          phone: "+33654783402",
          resumeLink: "http://fakelink.com",
        },
        establishmentContact: {
          contactMethod: "EMAIL",
          email: establishmentContact.email,
          firstName: establishmentContact.firstName,
          lastName: establishmentContact.lastName,
          phone: establishmentContact.phone,
          job: establishmentContact.job,
          copyEmails: establishmentContact.copyEmails,
        },
        exchanges: [
          {
            subject: "Demande de contact initiée par le bénéficiaire",
            message:
              "Bonjour, j'aimerais venir jouer chez vous. Je suis sympa.",
            recipient: "establishment",
            sender: "potentialBeneficiary",
            sentAt: discussion1Date,
          },
        ],
        immersionObjective: "Confirmer un projet professionnel",
      },
    ];

    uuidGenerator.setNextUuid("discussion2");
    const secondContactRequestDto: LegacyContactEstablishmentRequestDto = {
      appellationCode: appellationAndRome.appellationCode,
      siret,
      potentialBeneficiaryFirstName: "Bob",
      potentialBeneficiaryLastName: "Marley",
      potentialBeneficiaryEmail: "bob.marley@email.com",
      contactMode: "EMAIL",
      message: "Bonjour, j'aimerais venir jouer chez vous. Je suis sympa.",
      immersionObjective: "Confirmer un projet professionnel",
      potentialBeneficiaryPhone: "+33654783402",
      locationId: establishment.locations[0].id,
    };
    await contactEstablishment.execute(secondContactRequestDto);

    const establishmentAggregateAfterSecondContact =
      uow.establishmentAggregateRepository.establishmentAggregates[0];

    expect(uow.discussionRepository.discussions).toHaveLength(3);
    expect(
      establishmentAggregateAfterSecondContact.establishment.isSearchable,
    ).toBe(false);
  });

  describe("Wrong paths", () => {
    it("throws ConflictError if a recent contact requests already exists for the same potential beneficiary email, siret and appellation", async () => {
      const establishmentAggregate = establishmentAggregateWithEmailContact
        .withEstablishmentSiret(validEmailRequest.siret)
        .build();
      await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentAggregate,
      );

      const contactDate = new Date("2022-01-01T12:00:00.000Z");
      timeGateway.setNextDate(contactDate);

      uow.discussionRepository.discussions = [
        new DiscussionBuilder()
          .withAppellationCode(validEmailRequest.appellationCode)
          .withSiret(validEmailRequest.siret)
          .withPotentialBeneficiary({
            email: validEmailRequest.potentialBeneficiaryEmail,
          })
          .withCreatedAt(subDays(contactDate, 2))
          .build(),
      ];

      const discussionId = "someDiscussionUuid";
      uuidGenerator.setNextUuid(discussionId);

      await expectPromiseToFailWithError(
        contactEstablishment.execute(validEmailRequest),
        new ConflictError(
          [
            `A contact request already exists for siret ${validEmailRequest.siret} and appellation ${validEmailRequest.appellationCode}, and this potential beneficiary email.`,
            `Minimum ${minimumNumberOfDaysBetweenSimilarContactRequests} days between two similar contact requests.`,
          ].join("\n"),
        ),
      );
    });

    it("throws BadRequestError for contact mode mismatch", async () => {
      await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
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
          .withOffers([immersionOffer])
          .build(),
      );

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

    it("throws NotFoundError without contact id", async () => {
      await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
        new EstablishmentAggregateBuilder()
          .withEstablishment(
            new EstablishmentEntityBuilder().withSiret(siret).build(),
          )
          .withoutContact() // no contact
          .withOffers([immersionOffer])
          .build(),
      );

      await expectPromiseToFailWithError(
        contactEstablishment.execute({
          ...validRequest,
          contactMode: "PHONE",
        }),
        new NotFoundError(
          "No contact found for establishment with siret: 11112222333344",
        ),
      );
    });

    it("throws NotFoundError when no establishments found with given siret", async () => {
      await expectPromiseToFailWithError(
        contactEstablishment.execute({
          ...validRequest,
          contactMode: "PHONE",
        }),
        new NotFoundError("No establishment found with siret: 11112222333344"),
      );
    });

    it("throws BadRequestError when no offers found in establishment with given appellationCode", async () => {
      await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
        new EstablishmentAggregateBuilder()
          .withEstablishment(
            new EstablishmentEntityBuilder().withSiret(siret).build(),
          )
          .withContact(
            new ContactEntityBuilder()
              .withId("wrong_contact_id")
              .withContactMethod("PHONE")
              .build(),
          )
          .withOffers([
            new OfferEntityBuilder().withAppellationCode("wrong").build(),
          ])
          .build(),
      );

      await expectPromiseToFailWithError(
        contactEstablishment.execute({
          ...validRequest,
          contactMode: "PHONE",
        }),
        new BadRequestError(
          `Establishment with siret '${validRequest.siret}' doesn't have an immersion offer with appellation code '${validRequest.appellationCode}'.`,
        ),
      );
    });

    it("throws ForbidenError when establishment is not currently available", async () => {
      const establishmentAggregate = establishmentAggregateWithEmailContact
        .withIsSearchable(true)
        .withMaxContactsPerWeek(2)
        .withEstablishmentNextAvailabilityDate(addHours(timeGateway.now(), 1))
        .withOffers([immersionOffer])
        .build();
      await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentAggregate,
      );

      await expectPromiseToFailWithError(
        contactEstablishment.execute({
          ...validEmailRequest,
        }),
        new ForbiddenError(
          `The establishment ${establishmentAggregate.establishment.siret} is not available.`,
        ),
      );
    });
  });
});
