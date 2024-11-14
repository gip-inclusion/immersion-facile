import { addHours } from "date-fns";
import subDays from "date-fns/subDays";
import {
  AppellationAndRomeDto,
  ContactEstablishmentRequestDto,
  DiscussionBuilder,
  Location,
  UserBuilder,
  errors,
  expectArraysToEqual,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  EstablishmentAdminRight,
  EstablishmentUserRight,
} from "../entities/EstablishmentEntity";
import {
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
} from "../helpers/EstablishmentBuilders";
import { ContactEstablishment } from "./ContactEstablishment";

describe("ContactEstablishment", () => {
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

  const validEmailRequest: ContactEstablishmentRequestDto = {
    ...validRequest,
    contactMode: "EMAIL",
    datePreferences: "fake date preferences",
    hasWorkingExperience: true,
    experienceAdditionalInformation: "fake experience additional information",
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
    userId: establishmentAdmin.id,
    job: "",
    phone: "",
  };
  const userRights: EstablishmentUserRight[] = [
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
          .withContactMethod("EMAIL")
          .withLocations([location])
          .build(),
      )
      .withOffers([immersionOffer])
      .withUserRights(userRights);

  const minimumNumberOfDaysBetweenSimilarContactRequests = 3;

  let contactEstablishment: ContactEstablishment;
  let uuidGenerator: TestUuidGenerator;
  let timeGateway: CustomTimeGateway;
  let uow: InMemoryUnitOfWork;
  const domain = "domain.fr";

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    contactEstablishment = new ContactEstablishment(
      new InMemoryUowPerformer(uow),
      makeCreateNewEvent({
        timeGateway,
        uuidGenerator,
      }),
      uuidGenerator,
      timeGateway,
      minimumNumberOfDaysBetweenSimilarContactRequests,
      domain,
    );

    uow.romeRepository.appellations = [appellationAndRome];
    uow.userRepository.users = [establishmentAdmin, establishmentContact];
  });

  describe("Right paths", () => {
    it("schedules event for valid EMAIL contact request", async () => {
      const establishment = establishmentAggregateWithEmailContact.build();
      await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
        establishment,
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
          payload: {
            siret: establishment.establishment.siret,
            discussionId,
            triggeredBy: null,
            isLegacy: false,
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
            .withContactMethod("PHONE")
            .withLocations([location])
            .build(),
        )
        .withOffers([immersionOffer])
        .withUserRights(userRights)
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
            isLegacy: false,
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
              .withContactMethod("IN_PERSON")
              .withLocations([location])
              .build(),
          )
          .withOffers([immersionOffer])
          .withUserRights(userRights)
          .build(),
      );

      const discussionId = "discussion_id";
      const eventId = "contact_event_id";
      uuidGenerator.setNextUuids([discussionId, eventId]);

      const now = new Date("2021-12-08T15:00");
      timeGateway.setNextDates([now, now]);

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
          payload: {
            siret,
            discussionId,
            triggeredBy: null,
            isLegacy: false,
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
            experienceAdditionalInformation:
              validEmailRequest.experienceAdditionalInformation,
            hasWorkingExperience: validEmailRequest.hasWorkingExperience,
            datePreferences: validEmailRequest.datePreferences,
          },
          establishmentContact: {
            contactMethod: "EMAIL",
            email: establishmentAdmin.email,
            firstName: establishmentAdmin.firstName,
            lastName: establishmentAdmin.lastName,
            phone: establishmentAdminRight.phone,
            job: establishmentAdminRight.job,
            copyEmails: [establishmentContact.email],
          },
          createdAt: connectionDateStr,
          immersionObjective: "Confirmer un projet professionnel",
          exchanges: [
            {
              subject:
                "potential_beneficiary_first_name potential_beneficiary_last_name vous contacte pour une demande d'immersion sur le métier de My appellation label",
              sentAt: connectionDateStr,
              message: `<p>Bonjour ${establishmentAdmin.firstName} ${establishmentAdmin.lastName},</p>
                  
  <table width="600">
    <tr>
      <td>
        <p>Un candidat souhaite faire une immersion dans votre entreprise Company inside repository (24 rue des bouchers 67000 Strasbourg).<br/><br/>Immersion souhaitée :<br/><br/>• Métier : My appellation label.<br/>• Dates d’immersion envisagées : fake date preferences.<br/>• But de l'immersion : Je compte me former à ce métier.<br/><br/>Profil du candidat :<br/><br/>• Expérience professionnelle : j’ai déjà une ou plusieurs expériences professionnelles, ou de bénévolat.<br/>• Informations supplémentaires sur l'expérience du candidat : fake experience additional information.</p>
      </td>
    </tr>
  </table>

                  
  <table width="600">
    <tr>
      <td>
        <p><strong>Si la connexion ne fonctionne pas et que vous ne recevez pas le lien de réinitialisation du mot de passe, c'est que vous n'avez pas encore créé votre compte</strong>.<br/>Créer votre compte avec le même mail que celui avec lequel les candidats vous contactent.<br/><br/>Vous pouvez préparer votre échange grâce à notre <a href="https://immersion-facile.beta.gouv.fr/aide/article/etudier-une-demande-dimmersion-professionnelle-1ehkehm/">page d'aide</a>.<br/><br/>Bonne journée,<br/>L'équipe Immersion Facilitée</p>
      </td>
    </tr>
  </table>
`,
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
      const establishmentAggregate = establishmentAggregateWithEmailContact
        .withIsSearchable(true)
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
          immersionObjective: "Confirmer un projet professionnel",
          status: "PENDING",
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
        immersionObjective: "Confirmer un projet professionnel",
        potentialBeneficiaryPhone: "+33654783402",
        locationId: establishment.locations[0].id,
        datePreferences: "fake date preferences",
        hasWorkingExperience: true,
        experienceAdditionalInformation:
          "fake experience additional information",
      };
      await contactEstablishment.execute(secondContactRequestDto);

      const establishmentAggregateAfterSecondContact =
        uow.establishmentAggregateRepository.establishmentAggregates[0];

      expect(uow.discussionRepository.discussions).toHaveLength(3);
      expect(
        establishmentAggregateAfterSecondContact.establishment.isSearchable,
      ).toBe(false);
    });
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
        errors.establishment.contactRequestConflict({
          appellationCode: validEmailRequest.appellationCode,
          siret: validEmailRequest.siret,
          minimumNumberOfDaysBetweenSimilarContactRequests,
        }),
      );
    });

    it("throws BadRequestError for contact mode mismatch", async () => {
      const establishment = new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityBuilder()
            .withSiret(siret)
            .withContactMethod("EMAIL")
            .build(),
        )
        .withOffers([immersionOffer])
        .withUserRights(userRights)
        .build();
      await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
        establishment,
      );

      const params: ContactEstablishmentRequestDto = {
        ...validRequest,
        contactMode: "IN_PERSON",
      };
      await expectPromiseToFailWithError(
        contactEstablishment.execute(params),
        errors.establishment.contactRequestContactModeMismatch({
          siret: params.siret,
          contactMethods: {
            inParams: params.contactMode,
            inRepo: establishment.establishment.contactMethod,
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
              .withContactMethod("PHONE")
              .withSiret(siret)
              .build(),
          )
          .withUserRights(userRights)
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
          appellationCode: validRequest.appellationCode,
          siret: validRequest.siret,
          mode: "bad request",
        }),
      );
    });

    it("throws ForbidenError when establishment is not currently available", async () => {
      const establishmentAggregate = establishmentAggregateWithEmailContact
        .withIsSearchable(true)
        .withMaxContactsPerMonth(2)
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
        errors.establishment.forbiddenUnavailable({
          siret: validEmailRequest.siret,
        }),
      );
    });
  });
});
