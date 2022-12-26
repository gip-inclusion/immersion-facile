import {
  ContactEstablishmentRequestDto,
  expectTypeToMatchAndEqual,
} from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryDiscussionAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryDiscussionAggregateRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InsertDiscussionAggregateFromContactRequest } from "./InsertDiscussionAggregateFromContactRequest";

describe("Insert discussion aggregate from contact request DTO", () => {
  it("Converts the contact request DTO into a discussion aggregate and adds in to repo", async () => {
    // Prepare
    const discussionAggregateRepository =
      new InMemoryDiscussionAggregateRepository();
    const uuidGenerator = new TestUuidGenerator();
    const timeGateway = new CustomTimeGateway();
    const uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      discussionAggregateRepository,
    });

    const useCase = new InsertDiscussionAggregateFromContactRequest(
      uowPerformer,
      timeGateway,
      uuidGenerator,
    );
    const connectionDate = new Date("2022-01-01T12:00:00.000");
    const discussionId = "someDiscussionUuid";
    timeGateway.setNextDate(connectionDate);
    uuidGenerator.setNextUuid(discussionId);

    // Act
    const contactRequestDto: ContactEstablishmentRequestDto = {
      offer: { romeCode: "A1289", romeLabel: "Guitariste" },
      siret: "01234567891011",
      potentialBeneficiaryFirstName: "Antoine",
      potentialBeneficiaryLastName: "Tourasse",
      potentialBeneficiaryEmail: "antoine.tourasse@email.com",
      contactMode: "EMAIL",
      message: "Bonjour, j'aimerais venir jouer chez vous. Je suis sympa.",
    };
    await useCase.execute(contactRequestDto);

    // Assert
    expect(discussionAggregateRepository.discussionAggregates).toHaveLength(1);
    expectTypeToMatchAndEqual(
      discussionAggregateRepository.discussionAggregates[0],
      {
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
      },
    );
  });
});
