import {
  ContactEstablishmentRequestDto,
  expectArraysToEqual,
  expectPromiseToFailWithError,
  expectToEqual,
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
import { InMemoryDiscussionAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryDiscussionAggregateRepository";
import { InMemoryEstablishmentAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { ContactEstablishment } from "./ContactEstablishment";

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

describe("ContactEstablishment", () => {
  let contactEstablishment: ContactEstablishment;
  let establishmentAggregateRepository: InMemoryEstablishmentAggregateRepository;
  let outboxRepository: InMemoryOutboxRepository;
  let discussionAggregateRepository: InMemoryDiscussionAggregateRepository;
  let uowPerformer: UnitOfWorkPerformer;
  let uuidGenerator: TestUuidGenerator;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    const uow = createInMemoryUow();
    establishmentAggregateRepository = uow.establishmentAggregateRepository;
    outboxRepository = uow.outboxRepository;
    discussionAggregateRepository = uow.discussionAggregateRepository;
    uowPerformer = new InMemoryUowPerformer(uow);
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({
      timeGateway,
      uuidGenerator,
    });

    contactEstablishment = new ContactEstablishment(
      uowPerformer,
      createNewEvent,
      uuidGenerator,
      timeGateway,
    );
  });

  it("schedules event for valid EMAIL contact request", async () => {
    await establishmentAggregateRepository.insertEstablishmentAggregates([
      establishmentAggregateWithEmailContact.build(),
    ]);

    const discussionId = "discussion_id";
    const eventId = "contact_event_id";
    uuidGenerator.setNextUuids([discussionId, eventId]);

    const now = new Date("2021-12-08T15:00");
    timeGateway.setNextDate(now);

    await contactEstablishment.execute(validEmailRequest);

    expectArraysToEqual(outboxRepository.events, [
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

    expectArraysToEqual(outboxRepository.events, [
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

    expectArraysToEqual(outboxRepository.events, [
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
    await establishmentAggregateRepository.insertEstablishmentAggregates([
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
    expect(discussionAggregateRepository.discussionAggregates).toHaveLength(1);
    expectToEqual(discussionAggregateRepository.discussionAggregates, [
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
          contactMode: "EMAIL",
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
      .build();
    await establishmentAggregateRepository.insertEstablishmentAggregates([
      establishmentAggregate,
    ]);
    const establishment = establishmentAggregate.establishment;
    const establishmentContact = establishmentAggregate.contact!;

    const connectionDate = new Date("2022-01-10T12:00:00.000");
    timeGateway.setNextDate(connectionDate);

    const discussion1Date = new Date("2022-01-09T12:00:00.000");
    const discussionToOldDate = new Date("2022-01-02T12:00:00.000");
    discussionAggregateRepository.discussionAggregates = [
      {
        id: "discussionToOld",
        appellationCode: "12898",
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
          contactMode: "EMAIL",
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
        appellationCode: "12898",
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
          contactMode: "EMAIL",
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
      appellationCode: "12347",
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
      establishmentAggregateRepository.establishmentAggregates[0];

    expect(discussionAggregateRepository.discussionAggregates).toHaveLength(3);
    expect(
      establishmentAggregateAfterSecondContact.establishment.isSearchable,
    ).toBe(false);
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

// import { ContactEstablishmentRequestDto, expectToEqual } from "shared";
// import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
// import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
// import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
// import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
// import { InMemoryDiscussionAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryDiscussionAggregateRepository";
// import { InMemoryEstablishmentAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
// import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
// import { InsertDiscussionAggregateFromContactRequest } from "./InsertDiscussionAggregateFromContactRequest";
//
// const siret = "01234567891011";
// const searchableEstablishmentAggregate = new EstablishmentAggregateBuilder()
//   .withEstablishmentSiret(siret)
//   .withMaxContactsPerWeek(2)
//   .withIsSearchable(true)
//   .build();
// const establishmentAddress =
//   searchableEstablishmentAggregate.establishment.address;
// const establishmentContact = searchableEstablishmentAggregate.contact!;
//
// describe("Insert discussion aggregate from contact request DTO", () => {
//   let insertDiscussionAggregate: InsertDiscussionAggregateFromContactRequest;
//   let discussionAggregateRepository: InMemoryDiscussionAggregateRepository;
//   let uuidGenerator: TestUuidGenerator;
//   let timeGateway: CustomTimeGateway;
//   let establishmentAggregateRepository: InMemoryEstablishmentAggregateRepository;
//
//   beforeEach(async () => {
//     const uow = createInMemoryUow();
//     discussionAggregateRepository = uow.discussionAggregateRepository;
//     establishmentAggregateRepository = uow.establishmentAggregateRepository;
//     const uowPerformer = new InMemoryUowPerformer(uow);
//
//     uuidGenerator = new TestUuidGenerator();
//     timeGateway = new CustomTimeGateway();
//
//     insertDiscussionAggregate = new InsertDiscussionAggregateFromContactRequest(
//       uowPerformer,
//       timeGateway,
//       uuidGenerator,
//     );
//
//     await establishmentAggregateRepository.insertEstablishmentAggregates([
//       searchableEstablishmentAggregate,
//     ]);
//   });
//
//   it("Converts the contact request DTO into a discussion aggregate and adds in to repo", async () => {
//     // Prepare
//
//     const connectionDate = new Date("2022-01-01T12:00:00.000");
//     timeGateway.setNextDate(connectionDate);
//
//     const discussionId = "someDiscussionUuid";
//
//     uuidGenerator.setNextUuid(discussionId);
//
//     // Act
//     const contactRequestDto: ContactEstablishmentRequestDto = {
//       appellationCode: "12898",
//       siret: "01234567891011",
//       potentialBeneficiaryFirstName: "Antoine",
//       potentialBeneficiaryLastName: "Tourasse",
//       potentialBeneficiaryEmail: "antoine.tourasse@email.com",
//       contactMode: "EMAIL",
//       message: "Bonjour, j'aimerais venir jouer chez vous. Je suis sympa.",
//       immersionObjective: "Confirmer un projet professionnel",
//       potentialBeneficiaryPhone: "0654783402",
//     };
//     await insertDiscussionAggregate.execute(contactRequestDto);
//
//     // Assert
//     expect(discussionAggregateRepository.discussionAggregates).toHaveLength(1);
//     expectToEqual(discussionAggregateRepository.discussionAggregates[0], {
//       id: discussionId,
//       appellationCode: "12898",
//       siret: "01234567891011",
//       businessName: "Company inside repository",
//       address: establishmentAddress,
//       potentialBeneficiary: {
//         firstName: "Antoine",
//         lastName: "Tourasse",
//         email: "antoine.tourasse@email.com",
//         phone: "0654783402",
//       },
//       establishmentContact: {
//         contactMode: "EMAIL",
//         email: establishmentContact.email,
//         firstName: establishmentContact.firstName,
//         lastName: establishmentContact.lastName,
//         phone: establishmentContact.phone,
//         job: establishmentContact.job,
//         copyEmails: establishmentContact.copyEmails,
//       },
//       createdAt: connectionDate,
//       immersionObjective: "Confirmer un projet professionnel",
//       exchanges: [
//         {
//           subject: "Demande de contact initiée par le bénéficiaire",
//           sentAt: connectionDate,
//           message: contactRequestDto.message,
//           recipient: "establishment",
//           sender: "potentialBeneficiary",
//         },
//       ],
//     });
//   });
//
//   it("switches establishment is searchable to false when the max contacts per week is reached", async () => {
//     // préparation
//
//     const connectionDate = new Date("2022-01-10T12:00:00.000");
//     timeGateway.setNextDate(connectionDate);
//
//     const discussion1Date = new Date("2022-01-09T12:00:00.000");
//     const discussionToOldDate = new Date("2022-01-02T12:00:00.000");
//     discussionAggregateRepository.discussionAggregates = [
//       {
//         id: "discussionToOld",
//         appellationCode: "12898",
//         siret,
//         businessName: "Entreprise 1",
//         address: establishmentAddress,
//         immersionObjective: "Confirmer un projet professionnel",
//         potentialBeneficiary: {
//           firstName: "Antoine",
//           lastName: "Tourasse",
//           email: "antoine.tourasse@email.com",
//           phone: "0654678976",
//           resumeLink: "http://fakelink.com",
//         },
//         establishmentContact: {
//           contactMode: "EMAIL",
//           email: establishmentContact.email,
//           firstName: establishmentContact.firstName,
//           lastName: establishmentContact.lastName,
//           phone: establishmentContact.phone,
//           job: establishmentContact.job,
//           copyEmails: establishmentContact.copyEmails,
//         },
//         createdAt: discussionToOldDate,
//         exchanges: [
//           {
//             subject: "Demande de contact initiée par le bénéficiaire",
//             message: "Bonjour, c'est une vieille disucssion",
//             recipient: "establishment",
//             sender: "potentialBeneficiary",
//             sentAt: discussionToOldDate,
//           },
//         ],
//       },
//       {
//         id: "discussion1",
//         appellationCode: "12898",
//         createdAt: discussion1Date,
//         siret,
//         businessName: "Entreprise 2",
//         address: establishmentAddress,
//         potentialBeneficiary: {
//           firstName: "Antoine",
//           lastName: "Tourasse",
//           email: "antoine.tourasse@email.com",
//           phone: "0654678976",
//           resumeLink: "http://fakelink.com",
//         },
//         establishmentContact: {
//           contactMode: "EMAIL",
//           email: establishmentContact.email,
//           firstName: establishmentContact.firstName,
//           lastName: establishmentContact.lastName,
//           phone: establishmentContact.phone,
//           job: establishmentContact.job,
//           copyEmails: establishmentContact.copyEmails,
//         },
//         exchanges: [
//           {
//             subject: "Demande de contact initiée par le bénéficiaire",
//             message:
//               "Bonjour, j'aimerais venir jouer chez vous. Je suis sympa.",
//             recipient: "establishment",
//             sender: "potentialBeneficiary",
//             sentAt: discussion1Date,
//           },
//         ],
//         immersionObjective: "Confirmer un projet professionnel",
//       },
//     ];
//
//     uuidGenerator.setNextUuid("discussion2");
//     const secondContactRequestDto: ContactEstablishmentRequestDto = {
//       appellationCode: "12347",
//       siret,
//       potentialBeneficiaryFirstName: "Bob",
//       potentialBeneficiaryLastName: "Marley",
//       potentialBeneficiaryEmail: "bob.marley@email.com",
//       contactMode: "EMAIL",
//       message: "Bonjour, j'aimerais venir jouer chez vous. Je suis sympa.",
//       immersionObjective: "Confirmer un projet professionnel",
//       potentialBeneficiaryPhone: "0654783402",
//     };
//     await insertDiscussionAggregate.execute(secondContactRequestDto);
//
//     const establishmentAggregateAfterSecondContact =
//       establishmentAggregateRepository.establishmentAggregates[0];
//
//     expect(discussionAggregateRepository.discussionAggregates).toHaveLength(3);
//     expect(
//       establishmentAggregateAfterSecondContact.establishment.isSearchable,
//     ).toBe(false);
//   });
// });
