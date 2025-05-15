import { type BrevoEmailItem, expectToEqual } from "shared";
import { getDiscussionParamsFromEmail } from "./discussion.utils";
describe("getDiscussionParamsFromEmail", () => {
  it("should return the discussion id and the recipient kind", () => {
    const email: BrevoEmailItem = {
      To: [
        {
          Address: "john_doe__discussion-id_e@reply.domain.com",
          Name: "John Doe",
        },
      ],
      Uuid: ["8d79f2b1-20ae-4939-8d0b-d2517331a9e5"],
      MessageId:
        "<CADYedJsX7_KwtMJem4m-Dhwqp5fmBiqrdMzzDBu-7nbfAuY=ew@mail.gmail.com>",
      InReplyTo:
        "<CADYedJsS=ZXd8RPDjNuD7GhOwCgvaLwvAS=2kU3N+sd5wgu6Ag@mail.gmail.com>",
      From: {
        Name: "Enguerran Weiss",
        Address: "enguerranweiss@gmail.com",
      },
      Cc: [],
      Subject: "Test",
      RawTextBody: "Test",
      RawHtmlBody: "Test",
      ReplyTo: {
        Address: "john_doe__discussion-id_b@reply.domain.com",
        Name: "John Doe",
      },
      Attachments: [],
      SentAtDate: "2021-01-01",
    };
    const result = getDiscussionParamsFromEmail(email, "reply.domain.com");
    expectToEqual(result, {
      discussionId: "discussion-id",
      firstname: "john",
      lastname: "doe",
      recipientKind: "establishment",
    });
  });
});
