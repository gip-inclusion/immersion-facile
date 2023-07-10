import subDays from "date-fns/subDays";
import {
  AppellationAndRomeDto,
  ContactEstablishmentRequestDto,
  expectArraysToEqual,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { ContactEntityBuilder } from "../../../_testBuilders/ContactEntityBuilder";
import { DiscussionAggregateBuilder } from "../../../_testBuilders/DiscussionAggregateBuilder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/establishmentAggregate.test.helpers";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { ContactEstablishment } from "./ContactEstablishment";

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

const appellationAndRome: AppellationAndRomeDto = {
  appellationCode: validRequest.appellationCode,
  appellationLabel: "My appellation label",
  romeCode: "A0000",
  romeLabel: "Rome de test",
};

const immersionOffer = new ImmersionOfferEntityV2Builder()
  .withRomeCode(appellationAndRome.romeCode)
  .withAppellationCode(validRequest.appellationCode)
  .withAppellationLabel(appellationAndRome.appellationLabel)
  .build();

const validEmailRequest: ContactEstablishmentRequestDto = {
  ...validRequest,
  contactMode: "EMAIL",
  message: "message_to_send",
  immersionObjective: "Confirmer un projet professionnel",
  potentialBeneficiaryPhone: "0654783402",
};

const establishmentAggregateWithEmailContact =
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
    .withImmersionOffers([immersionOffer]);

const minimumNumberOfDaysBetweenSimilarContactRequests = 3;

describe("ContactEstablishment", () => {
  let contactEstablishment: ContactEstablishment;
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

    contactEstablishment = new ContactEstablishment(
      uowPerformer,
      createNewEvent,
      uuidGenerator,
      timeGateway,
      minimumNumberOfDaysBetweenSimilarContactRequests,
    );
  });

  it("schedules event for valid EMAIL contact request", async () => {
    await uow.establishmentAggregateRepository.insertEstablishmentAggregates([
      establishmentAggregateWithEmailContact.build(),
    ]);

    const discussionId = "discussion_id";
    const eventId = "contact_event_id";
    uuidGenerator.setNextUuids([discussionId, eventId]);

    const now = new Date("2021-12-08T15:00");
    timeGateway.setNextDate(now);

    await contactEstablishment.execute(validEmailRequest);

    expectArraysToEqual(uow.outboxRepository.events, [
      {
        id: eventId,
        occurredAt: now.toISOString(),
        topic: "ContactRequestedByBeneficiary",
        payload: { ...validEmailRequest, discussionId },
        publications: [],
        wasQuarantined: false,
      },
    ]);
  });

  it("schedules event for valid PHONE contact request", async () => {
    await uow.establishmentAggregateRepository.insertEstablishmentAggregates([
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

    const discussionId = "discussion_id";
    const eventId = "contact_event_id";
    uuidGenerator.setNextUuids([discussionId, eventId]);

    const now = new Date("2021-12-08T15:00");
    timeGateway.setNextDate(now);

    const validPhoneRequest: ContactEstablishmentRequestDto = {
      ...validRequest,
      contactMode: "PHONE",
    };
    await contactEstablishment.execute(validPhoneRequest);

    expectArraysToEqual(uow.outboxRepository.events, [
      {
        id: eventId,
        occurredAt: now.toISOString(),
        topic: "ContactRequestedByBeneficiary",
        payload: { ...validPhoneRequest, discussionId },
        publications: [],
        wasQuarantined: false,
      },
    ]);
  });

  it("schedules event for valid IN_PERSON contact requests", async () => {
    await uow.establishmentAggregateRepository.insertEstablishmentAggregates([
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

    const discussionId = "discussion_id";
    const eventId = "contact_event_id";
    uuidGenerator.setNextUuids([discussionId, eventId]);

    const now = new Date("2021-12-08T15:00");
    timeGateway.setNextDate(now);

    const validInPersonRequest: ContactEstablishmentRequestDto = {
      ...validRequest,
      contactMode: "IN_PERSON",
    };
    await contactEstablishment.execute(validInPersonRequest);

    expectArraysToEqual(uow.outboxRepository.events, [
      {
        id: eventId,
        occurredAt: now.toISOString(),
        topic: "ContactRequestedByBeneficiary",
        payload: { ...validInPersonRequest, discussionId },
        publications: [],
        wasQuarantined: false,
      },
    ]);
  });

  it("creates a Discussion Aggregate and adds in to repo", async () => {
    // Prepare
    const establishmentAggregate =
      establishmentAggregateWithEmailContact.build();
    await uow.establishmentAggregateRepository.insertEstablishmentAggregates([
      establishmentAggregate,
    ]);
    const establishment = establishmentAggregate.establishment;
    const establishmentContact = establishmentAggregate.contact!;

    const connectionDate = new Date("2022-01-01T12:00:00.000");
    timeGateway.setNextDate(connectionDate);

    const discussionId = "someDiscussionUuid";
    uuidGenerator.setNextUuid(discussionId);

    await contactEstablishment.execute(validEmailRequest);

    // Assert
    expectToEqual(uow.discussionAggregateRepository.discussionAggregates, [
      {
        id: discussionId,
        appellationCode: "12898",
        siret: validEmailRequest.siret,
        businessName: "Company inside repository",
        address: establishment.address,
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
        createdAt: connectionDate,
        immersionObjective: "Confirmer un projet professionnel",
        exchanges: [
          {
            subject: "Demande de contact initiée par le bénéficiaire",
            sentAt: connectionDate,
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
      .withImmersionOffers([immersionOffer])
      .build();
    await uow.establishmentAggregateRepository.insertEstablishmentAggregates([
      establishmentAggregate,
    ]);
    const establishment = establishmentAggregate.establishment;
    const establishmentContact = establishmentAggregate.contact!;

    const connectionDate = new Date("2022-01-10T12:00:00.000");
    timeGateway.setNextDate(connectionDate);

    const discussion1Date = new Date("2022-01-09T12:00:00.000");
    const discussionToOldDate = new Date("2022-01-02T12:00:00.000");
    uow.discussionAggregateRepository.discussionAggregates = [
      {
        id: "discussionToOld",
        appellationCode: appellationAndRome.appellationCode,
        siret,
        businessName: "Entreprise 1",
        address: establishment.address,
        immersionObjective: "Confirmer un projet professionnel",
        potentialBeneficiary: {
          firstName: "Antoine",
          lastName: "Tourasse",
          email: "antoine.tourasse@email.com",
          phone: "0654678976",
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
        address: establishment.address,
        potentialBeneficiary: {
          firstName: "Antoine",
          lastName: "Tourasse",
          email: "antoine.tourasse@email.com",
          phone: "0654678976",
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
    const secondContactRequestDto: ContactEstablishmentRequestDto = {
      appellationCode: appellationAndRome.appellationCode,
      siret,
      potentialBeneficiaryFirstName: "Bob",
      potentialBeneficiaryLastName: "Marley",
      potentialBeneficiaryEmail: "bob.marley@email.com",
      contactMode: "EMAIL",
      message: "Bonjour, j'aimerais venir jouer chez vous. Je suis sympa.",
      immersionObjective: "Confirmer un projet professionnel",
      potentialBeneficiaryPhone: "0654783402",
    };
    await contactEstablishment.execute(secondContactRequestDto);

    const establishmentAggregateAfterSecondContact =
      uow.establishmentAggregateRepository.establishmentAggregates[0];

    expect(uow.discussionAggregateRepository.discussionAggregates).toHaveLength(
      3,
    );
    expect(
      establishmentAggregateAfterSecondContact.establishment.isSearchable,
    ).toBe(false);
  });

  describe("Wrong paths", () => {
    it("throws ConflictError if a recent contact requests already exists for the same potential beneficiary email, siret and appellation", async () => {
      const establishmentAggregate = establishmentAggregateWithEmailContact
        .withEstablishmentSiret(validEmailRequest.siret)
        .build();
      await uow.establishmentAggregateRepository.insertEstablishmentAggregates([
        establishmentAggregate,
      ]);

      const contactDate = new Date("2022-01-01T12:00:00.000Z");
      timeGateway.setNextDate(contactDate);

      uow.discussionAggregateRepository.discussionAggregates = [
        new DiscussionAggregateBuilder()
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
      await uow.establishmentAggregateRepository.insertEstablishmentAggregates([
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

    it("throws NotFoundError without contact id", async () => {
      await uow.establishmentAggregateRepository.insertEstablishmentAggregates([
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
        new NotFoundError(
          `No contact found for establishment with siret: 11112222333344`,
        ),
      );
    });

    it("throws NotFoundError when no establishments found with given siret", async () => {
      await expectPromiseToFailWithError(
        contactEstablishment.execute({
          ...validRequest,
          contactMode: "PHONE",
        }),
        new NotFoundError(`11112222333344`),
      );
    });

    it("throws BadRequestError when no offers found in establishment with given appellationCode", async () => {
      await uow.establishmentAggregateRepository.insertEstablishmentAggregates([
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
          .withImmersionOffers([
            new ImmersionOfferEntityV2Builder()
              .withAppellationCode("wrong")
              .build(),
          ])
          .build(),
      ]);

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
  });
});
