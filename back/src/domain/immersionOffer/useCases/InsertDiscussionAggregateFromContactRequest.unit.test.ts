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

    const searchableEstablishmentAggregate = new EstablishmentAggregateBuilder()
      .withEstablishmentSiret(siret)
      .withMaxContactsPerWeek(2)
      .withIsSearchable(true)
      .build();
    await establishmentAggregateRepository.insertEstablishmentAggregates([
      searchableEstablishmentAggregate,
    ]);
  });
  it("Converts the contact request DTO into a discussion aggregate and adds in to repo", async () => {
    // Prepare

    const connectionDate = new Date("2022-01-01T12:00:00.000");
    timeGateway.setNextDate(connectionDate);

    const discussionId = "someDiscussionUuid";
    uuidGenerator.setNextUuid(discussionId);

    // Act
    const contactRequestDto: ContactEstablishmentRequestDto = {
      romeCode: "A1289",
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
      romeCode: "A1289",
      siret: "01234567891011",
      potentialBeneficiaryFirstName: "Antoine",
      potentialBeneficiaryLastName: "Tourasse",
      potentialBeneficiaryEmail: "antoine.tourasse@email.com",
      contactMode: "EMAIL",
      createdAt: connectionDate,
      exchanges: [
        {
          sentAt: connectionDate,
          message: contactRequestDto.message,
          recipient: "establishment",
          sender: "potentialBeneficiary",
        },
      ],
      immersionObjective: "Confirmer un projet professionnel",
      potentialBeneficiaryPhone: "0654783402",
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
        romeCode: "A1289",
        siret,
        potentialBeneficiaryFirstName: "Antoine",
        potentialBeneficiaryLastName: "Tourasse",
        potentialBeneficiaryEmail: "antoine.tourasse@email.com",
        contactMode: "EMAIL",
        createdAt: discussionToOldDate,
        exchanges: [
          {
            message: "Bonjour, c'est une vieille disucssion",
            recipient: "establishment",
            sender: "potentialBeneficiary",
            sentAt: discussionToOldDate,
          },
        ],
        immersionObjective: "Confirmer un projet professionnel",
        potentialBeneficiaryResumeLink: "http://fakelink.com",
        potentialBeneficiaryPhone: "0654678976",
      },
      {
        id: "discussion1",
        romeCode: "A1289",
        siret,
        potentialBeneficiaryFirstName: "Antoine",
        potentialBeneficiaryLastName: "Tourasse",
        potentialBeneficiaryEmail: "antoine.tourasse@email.com",
        contactMode: "EMAIL",
        createdAt: discussion1Date,
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
        potentialBeneficiaryResumeLink: "http://fakelink.com",
        potentialBeneficiaryPhone: "0654678976",
      },
    ];

    uuidGenerator.setNextUuid("discussion2");
    const secondContactRequestDto: ContactEstablishmentRequestDto = {
      romeCode: "A1289",
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
