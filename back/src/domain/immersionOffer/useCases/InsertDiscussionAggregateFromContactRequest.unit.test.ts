import { ContactEstablishmentRequestDto, expectToEqual } from "shared";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryDiscussionAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryDiscussionAggregateRepository";
import { InMemoryEstablishmentAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InsertDiscussionAggregateFromContactRequest } from "./InsertDiscussionAggregateFromContactRequest";

const siret = "01234567891011";
const searchableEstablishmentAggregate = new EstablishmentAggregateBuilder()
  .withEstablishmentSiret(siret)
  .withMaxContactsPerWeek(2)
  .withIsSearchable(true)
  .build();
const establishmentAddress =
  searchableEstablishmentAggregate.establishment.address;
const establishmentContact = searchableEstablishmentAggregate.contact!;

describe("Insert discussion aggregate from contact request DTO", () => {
  let insertDiscussionAggregate: InsertDiscussionAggregateFromContactRequest;
  let discussionAggregateRepository: InMemoryDiscussionAggregateRepository;
  let uuidGenerator: TestUuidGenerator;
  let timeGateway: CustomTimeGateway;
  let establishmentAggregateRepository: InMemoryEstablishmentAggregateRepository;

  beforeEach(async () => {
    const uow = createInMemoryUow();
    discussionAggregateRepository = uow.discussionAggregateRepository;
    establishmentAggregateRepository = uow.establishmentAggregateRepository;
    const uowPerformer = new InMemoryUowPerformer(uow);

    uuidGenerator = new TestUuidGenerator();
    timeGateway = new CustomTimeGateway();

    insertDiscussionAggregate = new InsertDiscussionAggregateFromContactRequest(
      uowPerformer,
      timeGateway,
      uuidGenerator,
    );

    await establishmentAggregateRepository.insertEstablishmentAggregates([
      searchableEstablishmentAggregate,
    ]);
  });

  it("Converts the contact request DTO into a discussion aggregate and adds in to repo", async () => {
    // Prepare

    const connectionDate = new Date("2022-01-01T12:00:00.000");
    timeGateway.setNextDate(connectionDate);

    const discussionId = "someDiscussionUuid";
    const potentialBeneficiaryEmailUuid = "potentialBeneficiaryEmailUuid";
    const establishmentContactEmailUuid = "establishmentContactEmailUuid";

    uuidGenerator.setNextUuids([
      discussionId,
      potentialBeneficiaryEmailUuid,
      establishmentContactEmailUuid,
    ]);

    // Act
    const contactRequestDto: ContactEstablishmentRequestDto = {
      appellationCode: "12898",
      siret: "01234567891011",
      potentialBeneficiaryFirstName: "Antoine",
      potentialBeneficiaryLastName: "Tourasse",
      potentialBeneficiaryEmail: "antoine.tourasse@email.com",
      contactMode: "EMAIL",
      message: "Bonjour, j'aimerais venir jouer chez vous. Je suis sympa.",
      immersionObjective: "Confirmer un projet professionnel",
      potentialBeneficiaryPhone: "0654783402",
    };
    await insertDiscussionAggregate.execute(contactRequestDto);

    // Assert
    expect(discussionAggregateRepository.discussionAggregates).toHaveLength(1);
    expectToEqual(discussionAggregateRepository.discussionAggregates[0], {
      id: discussionId,
      appellationCode: "12898",
      siret: "01234567891011",
      address: establishmentAddress,
      potentialBeneficiary: {
        emailUuid: potentialBeneficiaryEmailUuid,
        firstName: "Antoine",
        lastName: "Tourasse",
        email: "antoine.tourasse@email.com",
        phone: "0654783402",
      },
      establishmentContact: {
        emailUuid: establishmentContactEmailUuid,
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
          sentAt: connectionDate,
          message: contactRequestDto.message,
          recipient: "establishment",
          sender: "potentialBeneficiary",
        },
      ],
    });
  });

  it("switches establishment is searchable to false when the max contacts per week is reached", async () => {
    // préparation

    const connectionDate = new Date("2022-01-10T12:00:00.000");
    timeGateway.setNextDate(connectionDate);

    const discussion1Date = new Date("2022-01-09T12:00:00.000");
    const discussionToOldDate = new Date("2022-01-02T12:00:00.000");
    discussionAggregateRepository.discussionAggregates = [
      {
        id: "discussionToOld",
        appellationCode: "12898",
        siret,
        address: establishmentAddress,
        immersionObjective: "Confirmer un projet professionnel",
        potentialBeneficiary: {
          emailUuid: "email-uuid-beneficiary",
          firstName: "Antoine",
          lastName: "Tourasse",
          email: "antoine.tourasse@email.com",
          phone: "0654678976",
          resumeLink: "http://fakelink.com",
        },
        establishmentContact: {
          emailUuid: "email-uuid-establishment",
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
        address: establishmentAddress,
        potentialBeneficiary: {
          emailUuid: "email-uuid-beneficiary",
          firstName: "Antoine",
          lastName: "Tourasse",
          email: "antoine.tourasse@email.com",
          phone: "0654678976",
          resumeLink: "http://fakelink.com",
        },
        establishmentContact: {
          emailUuid: "email-uuid-establishment",
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
    await insertDiscussionAggregate.execute(secondContactRequestDto);

    const establishmentAggregateAfterSecondContact =
      establishmentAggregateRepository.establishmentAggregates[0];

    expect(discussionAggregateRepository.discussionAggregates).toHaveLength(3);
    expect(
      establishmentAggregateAfterSecondContact.establishment.isSearchable,
    ).toBe(false);
  });
});
