import { addHours } from "date-fns";
import subDays from "date-fns/subDays";
import {
  type AppellationAndRomeDto,
  type ContactEstablishmentRequestDto,
  DiscussionBuilder,
  errors,
  expectArraysToEqual,
  expectPromiseToFailWithError,
  expectToEqual,
  type LegacyContactEstablishmentRequestDto,
  type Location,
  UserBuilder,
} from "shared";

import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import type {
  EstablishmentAdminRight,
  EstablishmentUserRight,
} from "../entities/EstablishmentAggregate";
import {
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
} from "../helpers/EstablishmentBuilders";
import { LegacyContactEstablishment } from "./LegacyContactEstablishment";

describe("LegacyContactEstablishment", () => {
  const siret = "11112222333344";

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

  const validRequest: LegacyContactEstablishmentRequestDto = {
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

  const establishmentAdmin = new UserBuilder()
    .withId("establishment.admin")
    .withEmail("admin@establishment.com")
    .build();
  const establishmentContact = new UserBuilder()
    .withId("establishment.contact")
    .withEmail("contact@establishment.com")
    .build();

  const establishmentAdminRight: EstablishmentAdminRight = {
    role: "establishment-admin",
    job: "Boss",
    phone: "+33877995544",
    userId: establishmentAdmin.id,
  };
  const establishmentRights: EstablishmentUserRight[] = [
    establishmentAdminRight,
    {
      role: "establishment-contact",
      userId: establishmentContact.id,
    },
  ];

  const establishmentAggregateWithEmailContact =
    new EstablishmentAggregateBuilder()
      .withEstablishment(
        new EstablishmentEntityBuilder()
          .withSiret(siret)
          .withLocations([location])
          .withContactMode("EMAIL")
          .build(),
      )
      .withUserRights(establishmentRights)
      .withOffers([immersionOffer])
      .build();

  const minimumNumberOfDaysBetweenSimilarContactRequests = 3;

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

    contactEstablishment = new LegacyContactEstablishment(
      uowPerformer,
      makeCreateNewEvent({
        timeGateway,
        uuidGenerator,
      }),
      uuidGenerator,
      timeGateway,
      minimumNumberOfDaysBetweenSimilarContactRequests,
    );

    uow.romeRepository.appellations = [appellationAndRome];
    uow.userRepository.users = [establishmentAdmin, establishmentContact];
  });

  describe("Right paths", () => {
    it("schedules event for valid EMAIL contact request", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentAggregateWithEmailContact,
      ];

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
          payload: {
            siret: establishmentAggregateWithEmailContact.establishment.siret,
            discussionId,
            triggeredBy: null,
          },
          status: "never-published",
          publications: [],
          wasQuarantined: false,
        },
      ]);
    });

    it("schedules event for valid PHONE contact request", async () => {
      const establishment = new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityBuilder()
            .withSiret(siret)
            .withLocations([location])
            .withContactMode("PHONE")
            .build(),
        )
        .withUserRights(establishmentRights)
        .withOffers([immersionOffer])
        .build();
      await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
        establishment,
      );

      const discussionId = "discussion_id";
      const eventId = "contact_event_id";
      uuidGenerator.setNextUuids([discussionId, eventId]);

      const now = new Date("2021-12-08T15:00");
      timeGateway.setNextDates([now, now]);

      const validPhoneRequest: ContactEstablishmentRequestDto = {
        ...validRequest,
        contactMode: "PHONE",
        kind: "IF",
      };
      await contactEstablishment.execute(validPhoneRequest);

      expectArraysToEqual(uow.outboxRepository.events, [
        {
          id: eventId,
          occurredAt: now.toISOString(),
          topic: "ContactRequestedByBeneficiary",
          payload: {
            siret,
            discussionId,
            triggeredBy: null,
          },
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
              .withContactMode("IN_PERSON")
              .build(),
          )
          .withUserRights(establishmentRights)
          .withOffers([immersionOffer])
          .build(),
      );

      const discussionId = "discussion_id";
      const eventId = "contact_event_id";
      uuidGenerator.setNextUuids([discussionId, eventId]);

      const now = new Date("2021-12-08T15:00");
      timeGateway.setNextDates([now, now]);

      const validInPersonRequest: ContactEstablishmentRequestDto = {
        ...validRequest,
        kind: "IF",
        contactMode: "IN_PERSON",
      };
      await contactEstablishment.execute(validInPersonRequest);

      expectArraysToEqual(uow.outboxRepository.events, [
        {
          id: eventId,
          occurredAt: now.toISOString(),
          topic: "ContactRequestedByBeneficiary",
          payload: {
            siret,
            discussionId,
            triggeredBy: null,
          },
          publications: [],
          status: "never-published",
          wasQuarantined: false,
        },
      ]);
    });

    it("creates a Discussion Aggregate and adds in to repo", async () => {
      // Prepare

      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentAggregateWithEmailContact,
      ];

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
          address:
            establishmentAggregateWithEmailContact.establishment.locations[0]
              .address,
          contactMode: "EMAIL",
          kind: "IF",
          potentialBeneficiary: {
            firstName: validEmailRequest.potentialBeneficiaryFirstName,
            lastName: validEmailRequest.potentialBeneficiaryLastName,
            email: validEmailRequest.potentialBeneficiaryEmail,
            phone: validEmailRequest.potentialBeneficiaryPhone,
            resumeLink: validEmailRequest.potentialBeneficiaryResumeLink,
            hasWorkingExperience: false,
            datePreferences: "Dates d’immersion envisagées non renseignées",
            immersionObjective: "Confirmer un projet professionnel",
          },
          establishmentContact: {
            email: establishmentAdmin.email,
            firstName: establishmentAdmin.firstName,
            lastName: establishmentAdmin.lastName,
            phone: establishmentAdminRight.phone,
            job: establishmentAdminRight.job,
            copyEmails: [establishmentContact.email],
          },
          createdAt: connectionDateStr,
          exchanges: [
            {
              subject: "Demande de contact initiée par le bénéficiaire",
              sentAt: connectionDateStr,
              message: validEmailRequest.message,
              recipient: "establishment",
              sender: "potentialBeneficiary",
              attachments: [],
            },
          ],
          status: "PENDING",
        },
      ]);
    });

    it("switches establishment is searchable to false when the max contacts per week is reached", async () => {
      // préparation
      const establishmentAggregate = new EstablishmentAggregateBuilder(
        establishmentAggregateWithEmailContact,
      )
        .withIsMaxDiscussionsForPeriodReached(false)
        .withMaxContactsPerMonth(2)
        .withOffers([immersionOffer])
        .build();

      await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentAggregate,
      );
      const establishment = establishmentAggregate.establishment;

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
          contactMode: "EMAIL",
          kind: "IF",
          potentialBeneficiary: {
            firstName: "Antoine",
            lastName: "Tourasse",
            email: "antoine.tourasse@email.com",
            phone: "+33654783402",
            resumeLink: "http://fakelink.com",
            hasWorkingExperience: true,
            datePreferences: "fake date preferences",
            immersionObjective: "Confirmer un projet professionnel",
          },
          establishmentContact: {
            email: establishmentAdmin.email,
            firstName: establishmentAdmin.firstName,
            lastName: establishmentAdmin.lastName,
            phone: establishmentAdminRight.phone,
            job: establishmentAdminRight.job,
            copyEmails: [establishmentContact.email],
          },
          createdAt: discussionToOldDate,
          exchanges: [
            {
              subject: "Demande de contact initiée par le bénéficiaire",
              message: "Bonjour, c'est une vieille disucssion",
              recipient: "establishment",
              sender: "potentialBeneficiary",
              sentAt: discussionToOldDate,
              attachments: [],
            },
          ],
          status: "PENDING",
        },
        {
          id: "discussion1",
          appellationCode: appellationAndRome.appellationCode,
          createdAt: discussion1Date,
          siret,
          businessName: "Entreprise 2",
          address: establishment.locations[0].address,
          contactMode: "EMAIL",
          kind: "IF",
          potentialBeneficiary: {
            firstName: "Antoine",
            lastName: "Tourasse",
            email: "antoine.tourasse@email.com",
            phone: "+33654783402",
            resumeLink: "http://fakelink.com",
            hasWorkingExperience: true,
            datePreferences: "fake date preferences",
            immersionObjective: "Confirmer un projet professionnel",
          },
          establishmentContact: {
            email: establishmentAdmin.email,
            firstName: establishmentAdmin.firstName,
            lastName: establishmentAdmin.lastName,
            phone: establishmentAdminRight.phone,
            job: establishmentAdminRight.job,
            copyEmails: [establishmentContact.email],
          },
          exchanges: [
            {
              subject: "Demande de contact initiée par le bénéficiaire",
              message:
                "Bonjour, j'aimerais venir jouer chez vous. Je suis sympa.",
              recipient: "establishment",
              sender: "potentialBeneficiary",
              sentAt: discussion1Date,
              attachments: [],
            },
          ],
          status: "PENDING",
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
        establishmentAggregateAfterSecondContact.establishment
          .isMaxDiscussionsForPeriodReached,
      ).toBe(true);
    });
  });

  describe("Wrong paths", () => {
    it("throws ConflictError if a recent contact requests already exists for the same potential beneficiary email, siret and appellation", async () => {
      const establishmentAggregate = new EstablishmentAggregateBuilder(
        establishmentAggregateWithEmailContact,
      )
        .withEstablishmentSiret(validEmailRequest.siret)
        .build();

      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentAggregate,
      ];

      const contactDate = new Date("2022-01-01T12:00:00.000Z");
      timeGateway.setNextDate(contactDate);

      uow.discussionRepository.discussions = [
        new DiscussionBuilder()
          .withAppellationCode(validEmailRequest.appellationCode)
          .withSiret(validEmailRequest.siret)
          .withPotentialBeneficiaryEmail(
            validEmailRequest.potentialBeneficiaryEmail,
          )
          .withCreatedAt(subDays(contactDate, 2))
          .build(),
      ];

      const discussionId = "someDiscussionUuid";
      uuidGenerator.setNextUuid(discussionId);

      await expectPromiseToFailWithError(
        contactEstablishment.execute(validEmailRequest),
        errors.establishment.contactRequestConflict({
          siret: validEmailRequest.siret,
          appellationCode: validEmailRequest.appellationCode,
          minimumNumberOfDaysBetweenSimilarContactRequests,
        }),
      );
    });

    it("throws BadRequestError for contact mode mismatch", async () => {
      const establishment = new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityBuilder()
            .withSiret(siret)
            .withContactMode("EMAIL")
            .build(),
        )
        .withUserRights(establishmentRights)
        .withOffers([immersionOffer])
        .build();
      await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
        establishment,
      );

      await expectPromiseToFailWithError(
        contactEstablishment.execute({
          ...validRequest,
          contactMode: "IN_PERSON",
        }),
        errors.establishment.contactRequestContactModeMismatch({
          siret: establishment.establishment.siret,
          contactModes: {
            inParams: "IN_PERSON",
            inRepo: establishment.establishment.contactMode,
          },
        }),
      );
    });

    it("throws NotFoundError when no establishments found with given siret", async () => {
      await expectPromiseToFailWithError(
        contactEstablishment.execute({
          ...validRequest,
          contactMode: "PHONE",
        }),
        errors.establishment.notFound({ siret: validRequest.siret }),
      );
    });

    it("throws BadRequestError when no offers found in establishment with given appellationCode", async () => {
      await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
        new EstablishmentAggregateBuilder()
          .withEstablishment(
            new EstablishmentEntityBuilder()
              .withSiret(siret)
              .withContactMode("PHONE")
              .build(),
          )
          .withUserRights(establishmentRights)
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
        errors.establishment.offerMissing({
          siret: validRequest.siret,
          appellationCode: validEmailRequest.appellationCode,
          mode: "bad request",
        }),
      );
    });

    it("throws ForbidenError when establishment is not currently available", async () => {
      const establishmentAggregate = new EstablishmentAggregateBuilder(
        establishmentAggregateWithEmailContact,
      )
        .withIsMaxDiscussionsForPeriodReached(false)
        .withMaxContactsPerMonth(2)
        .withEstablishmentNextAvailabilityDate(addHours(timeGateway.now(), 1))
        .withOffers([immersionOffer])
        .build();

      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentAggregate,
      ];

      await expectPromiseToFailWithError(
        contactEstablishment.execute({
          ...validEmailRequest,
        }),
        errors.establishment.forbiddenUnavailable({
          siret: validEmailRequest.siret,
        }),
      );
    });
  });
});
