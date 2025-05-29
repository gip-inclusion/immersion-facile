import { subDays } from "date-fns";
import { expectToEqual } from "../test.helpers";
import { DiscussionBuilder } from "./DiscussionBuilder";
import type {
  DiscussionDisplayStatus,
  DiscussionReadDto,
  Exchange,
  ExchangeRole,
} from "./discussion.dto";
import { getDiscussionDisplayStatus } from "./discussion.helpers";
import {
  discussionReadSchema,
  makeExchangeEmailSchema,
} from "./discussion.schema";

describe("Discussions", () => {
  describe("getDiscussionDisplayStatus", () => {
    type TestCase = {
      message: string;
      discussion: DiscussionReadDto;
      expectedDisplayStatus: DiscussionDisplayStatus;
    };

    const createExchange = ({
      sentAt,
      sender,
    }: { sentAt: Date; sender: ExchangeRole }): Exchange => ({
      subject: "Some subject",
      message: "Some message",
      attachments: [],
      sentAt: sentAt.toISOString(),
      sender,
      recipient:
        sender === "potentialBeneficiary"
          ? "establishment"
          : "potentialBeneficiary",
    });

    const now = new Date("2025-05-12");

    const testCases: TestCase[] = [
      {
        message: "status is REJECTED",
        expectedDisplayStatus: "rejected",
        discussion: new DiscussionBuilder()
          .withStatus({ status: "REJECTED" })
          .buildRead(),
      },
      {
        message: "status is ACCEPTED",
        expectedDisplayStatus: "accepted",
        discussion: new DiscussionBuilder()
          .withStatus({ status: "ACCEPTED" })
          .buildRead(),
      },
      {
        message: "candidate has sent the first message without being answered",
        expectedDisplayStatus: "new",
        discussion: new DiscussionBuilder()
          .withStatus({ status: "PENDING" })
          .withExchanges([
            createExchange({
              sentAt: subDays(now, 1),
              sender: "potentialBeneficiary",
            }),
          ])
          .buildRead(),
      },
      {
        message:
          "candidate has sent the last message without being answered (but it is not the first message)",
        expectedDisplayStatus: "needs-answer",
        discussion: new DiscussionBuilder()
          .withStatus({ status: "PENDING" })
          .withExchanges([
            createExchange({
              sentAt: subDays(now, 3),
              sender: "potentialBeneficiary",
            }),
            createExchange({
              sentAt: subDays(now, 2),
              sender: "establishment",
            }),
            createExchange({
              sentAt: subDays(now, 1),
              sender: "potentialBeneficiary",
            }),
          ])
          .buildRead(),
      },
      {
        message: "last message is sent by establishment",
        expectedDisplayStatus: "answered",
        discussion: new DiscussionBuilder()
          .withStatus({ status: "PENDING" })
          .withExchanges([
            createExchange({
              sentAt: subDays(now, 2),
              sender: "potentialBeneficiary",
            }),
            createExchange({
              sentAt: subDays(now, 1),
              sender: "establishment",
            }),
          ])
          .buildRead(),
      },
      {
        message:
          "last message is from beneficiary and has had no answer for more than 15 days",
        expectedDisplayStatus: "needs-urgent-answer",
        discussion: new DiscussionBuilder()
          .withStatus({ status: "PENDING" })
          .withExchanges([
            createExchange({
              sentAt: subDays(now, 15),
              sender: "potentialBeneficiary",
            }),
          ])
          .buildRead(),
      },
      {
        message: "discussion contact method is recent and not email",
        expectedDisplayStatus: "new",
        discussion: new DiscussionBuilder()
          .withCreatedAt(subDays(now, 14))
          .withStatus({ status: "PENDING" })
          .withContactMode("PHONE")
          .withExchanges([])
          .buildRead(),
      },
      {
        message:
          "discussion contact method is older than 15 days and not email",
        expectedDisplayStatus: "needs-urgent-answer",
        discussion: new DiscussionBuilder()
          .withCreatedAt(subDays(now, 15))
          .withStatus({ status: "PENDING" })
          .withContactMode("PHONE")
          .withExchanges([])
          .buildRead(),
      },
    ];

    it.each(testCases)(
      "returns $expectedDisplayStatus when $message",
      ({ discussion, expectedDisplayStatus }) => {
        expectToEqual(
          getDiscussionDisplayStatus({ discussion, now }),
          expectedDisplayStatus,
        );
      },
    );
  });

  describe("Discussion schema", () => {
    const discussionEmailIF = new DiscussionBuilder()
      .withContactMode("EMAIL")
      .withDiscussionKind("IF")
      .build();

    const discussionEmail1E1S = new DiscussionBuilder()
      .withContactMode("EMAIL")
      .withDiscussionKind("1_ELEVE_1_STAGE")
      .build();

    const discussionPhoneIF = new DiscussionBuilder()
      .withContactMode("PHONE")
      .withDiscussionKind("IF")
      .build();

    const discussionPhone1E1S = new DiscussionBuilder()
      .withContactMode("PHONE")
      .withDiscussionKind("1_ELEVE_1_STAGE")
      .build();

    const discussionInPersonIF = new DiscussionBuilder()
      .withContactMode("IN_PERSON")
      .withDiscussionKind("IF")
      .build();

    const discussionInPerson1E1S = new DiscussionBuilder()
      .withContactMode("IN_PERSON")
      .withDiscussionKind("1_ELEVE_1_STAGE")
      .build();

    it.each([
      discussionEmailIF,
      discussionEmail1E1S,
      discussionInPerson1E1S,
      discussionInPersonIF,
      discussionPhone1E1S,
      discussionPhoneIF,
    ])(
      "Test discussionReadSchema",
      ({ establishmentContact, appellationCode, ...rest }) => {
        const discussionRead: DiscussionReadDto = {
          ...rest,
          establishmentContact: {
            firstName: establishmentContact.firstName,
            lastName: establishmentContact.lastName,
            job: establishmentContact.job,
          },
          appellation: {
            appellationCode: appellationCode,
            appellationLabel: "osef",
            romeCode: "A2023",
            romeLabel: "osef",
          },
        };

        expectToEqual(
          discussionReadSchema.parse(discussionRead),
          discussionRead,
        );
      },
    );
  });
});
describe("makeExchangeEmailSchema", () => {
  it("should parse the email", () => {
    const email = "firstname_lastname__discussionId_e@reply.domain.com";
    const result = makeExchangeEmailSchema("reply.domain.com").parse(email);
    expectToEqual(result, {
      firstname: "firstname",
      lastname: "lastname",
      discussionId: "discussionId",
      rawRecipientKind: "e",
    });
  });
  it("should parse the email even if recipient kind is not known", () => {
    const email = "firstname_lastname__discussionId_bob@reply.domain.com";
    const result = makeExchangeEmailSchema("reply.domain.com").parse(email);
    expectToEqual(result, {
      firstname: "firstname",
      lastname: "lastname",
      discussionId: "discussionId",
      rawRecipientKind: "bob",
    });
  });

  it("should handle the old email format", () => {
    const email = "discussionId_e@reply.domain.com";
    const result = makeExchangeEmailSchema("reply.domain.com").parse(email);
    expectToEqual(result, {
      discussionId: "discussionId",
      rawRecipientKind: "e",
    });
  });

  it("should throw an error if the email is not valid", () => {
    const email = "john_doe_discussionId_bob@reply.domain.com";
    expect(() =>
      makeExchangeEmailSchema("reply.domain.com").parse(email),
    ).toThrow();
  });
});
