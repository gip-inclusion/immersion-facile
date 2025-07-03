import {
  ConnectedUserBuilder,
  DiscussionBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { EstablishmentAggregateBuilder } from "../../helpers/EstablishmentBuilders";
import { GetDiscussionByIdForEstablishment } from "./GetDiscussionByIdForEstablishment";

describe("GetDiscussionByIdForEstablishment use case", () => {
  const user = new ConnectedUserBuilder().buildUser();
  const discussionWithUserEmailInContact = new DiscussionBuilder()
    .withEstablishmentContact({ email: user.email })
    .withId(uuid())
    .build();
  const discussionWithoutUserEmailInContact = new DiscussionBuilder()
    .withId(uuid())
    .build();

  let getDiscussionByIdForEstablishment: GetDiscussionByIdForEstablishment;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    getDiscussionByIdForEstablishment = new GetDiscussionByIdForEstablishment(
      new InMemoryUowPerformer(uow),
    );

    uow.userRepository.users = [user];
    uow.discussionRepository.discussions = [discussionWithUserEmailInContact];
  });

  describe("Wrong paths", () => {
    it("throws unauthorized if no jwt provided", async () => {
      await expectPromiseToFailWithError(
        getDiscussionByIdForEstablishment.execute(uuid()),
        errors.user.unauthorized(),
      );
    });

    describe("throws NotFound", () => {
      it("when user cannot be found", async () => {
        const userId = "user-404";
        await expectPromiseToFailWithError(
          getDiscussionByIdForEstablishment.execute(
            discussionWithUserEmailInContact.id,
            {
              userId,
            },
          ),
          errors.user.notFound({ userId }),
        );
      });

      it("when discussion cannot be found", async () => {
        uow.userRepository.users = [user];

        const missingDiscussionId = uuid();

        await expectPromiseToFailWithError(
          getDiscussionByIdForEstablishment.execute(missingDiscussionId, {
            userId: user.id,
          }),
          errors.discussion.notFound({ discussionId: missingDiscussionId }),
        );
      });

      it("when missing establishment", async () => {
        uow.discussionRepository.discussions = [
          discussionWithoutUserEmailInContact,
        ];
        uow.establishmentAggregateRepository.establishmentAggregates = [];

        await expectPromiseToFailWithError(
          getDiscussionByIdForEstablishment.execute(
            discussionWithoutUserEmailInContact.id,
            {
              userId: user.id,
            },
          ),
          errors.establishment.notFound({
            siret: discussionWithoutUserEmailInContact.siret,
          }),
        );
      });
    });

    describe("throws accessForbidden", () => {
      it("when user have no email matching discussions's contact or copy emails and no rights on establishment", async () => {
        const otherDiscussion = new DiscussionBuilder().build();

        uow.discussionRepository.discussions = [otherDiscussion];
        uow.establishmentAggregateRepository.establishmentAggregates = [
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(otherDiscussion.siret)
            .withUserRights([
              {
                role: "establishment-admin",
                job: "",
                phone: "",
                userId: "",
              },
            ])
            .build(),
        ];

        await expectPromiseToFailWithError(
          getDiscussionByIdForEstablishment.execute(otherDiscussion.id, {
            userId: user.id,
          }),
          errors.discussion.accessForbidden({
            discussionId: otherDiscussion.id,
            userId: user.id,
          }),
        );
      });

      it("when user doesn't have rights on discussion's establishment", async () => {
        uow.discussionRepository.discussions = [
          discussionWithoutUserEmailInContact,
        ];
        uow.establishmentAggregateRepository.establishmentAggregates = [
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(discussionWithoutUserEmailInContact.siret)
            .withUserRights([
              {
                role: "establishment-admin",
                job: "",
                phone: "",
                userId: "",
              },
            ])
            .build(),
        ];

        await expectPromiseToFailWithError(
          getDiscussionByIdForEstablishment.execute(
            discussionWithoutUserEmailInContact.id,
            {
              userId: user.id,
            },
          ),
          errors.discussion.accessForbidden({
            discussionId: discussionWithoutUserEmailInContact.id,
            userId: user.id,
          }),
        );
      });
    });
  });

  describe("Right paths", () => {
    describe("Discussion with kinds and methods", () => {
      it.each([
        new DiscussionBuilder(discussionWithUserEmailInContact)
          .withDiscussionKind("IF")
          .withContactMode("EMAIL")
          .build(),
        new DiscussionBuilder(discussionWithUserEmailInContact)
          .withDiscussionKind("IF")
          .withContactMode("IN_PERSON")
          .build(),
        new DiscussionBuilder(discussionWithUserEmailInContact)
          .withDiscussionKind("IF")
          .withContactMode("PHONE")
          .build(),
        new DiscussionBuilder(discussionWithUserEmailInContact)
          .withDiscussionKind("1_ELEVE_1_STAGE")
          .withContactMode("EMAIL")
          .build(),
        new DiscussionBuilder(discussionWithUserEmailInContact)
          .withDiscussionKind("1_ELEVE_1_STAGE")
          .withContactMode("IN_PERSON")
          .build(),
        new DiscussionBuilder(discussionWithUserEmailInContact)
          .withDiscussionKind("1_ELEVE_1_STAGE")
          .withContactMode("PHONE")
          .build(),
      ])(
        "Gets discussion with kind $kind and contact mode $contactMode based on establishment contact email",
        async (discussion) => {
          uow.discussionRepository.discussions = [discussion];

          expectToEqual(
            await getDiscussionByIdForEstablishment.execute(
              discussionWithUserEmailInContact.id,
              {
                userId: user.id,
              },
            ),
            new DiscussionBuilder(discussion).buildRead(),
          );
        },
      );
    });

    describe("email matching on discussion", () => {
      it("Gets the matching discussion based on establishment contact email", async () => {
        expectToEqual(
          await getDiscussionByIdForEstablishment.execute(
            discussionWithUserEmailInContact.id,
            {
              userId: user.id,
            },
          ),
          new DiscussionBuilder(discussionWithUserEmailInContact).buildRead(),
        );
      });

      it("Gets the matching discussion based on establishment copy emails", async () => {
        const userOnCopyEmailsDiscussion = new DiscussionBuilder()
          .withEstablishmentContact({ copyEmails: [user.email] })
          .withId(uuid())
          .build();

        uow.discussionRepository.discussions = [userOnCopyEmailsDiscussion];

        expectToEqual(
          await getDiscussionByIdForEstablishment.execute(
            userOnCopyEmailsDiscussion.id,
            {
              userId: user.id,
            },
          ),
          new DiscussionBuilder(userOnCopyEmailsDiscussion).buildRead(),
        );
      });

      it("Gets the matching discussion based on establishment copy emails and contact email", async () => {
        const userBothOnCopyEmailsAndContactEmailDiscussion =
          new DiscussionBuilder()
            .withEstablishmentContact({
              copyEmails: [user.email],
              email: user.email,
            })
            .withId(uuid())
            .build();

        uow.discussionRepository.discussions = [
          userBothOnCopyEmailsAndContactEmailDiscussion,
        ];

        expectToEqual(
          await getDiscussionByIdForEstablishment.execute(
            userBothOnCopyEmailsAndContactEmailDiscussion.id,
            {
              userId: user.id,
            },
          ),
          new DiscussionBuilder(
            userBothOnCopyEmailsAndContactEmailDiscussion,
          ).buildRead(),
        );
      });
    });

    describe("user has rights on discussion's establishment", () => {
      beforeEach(() => {
        uow.discussionRepository.discussions = [
          discussionWithoutUserEmailInContact,
        ];
      });

      it("user has establishment admin right", async () => {
        uow.establishmentAggregateRepository.establishmentAggregates = [
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(discussionWithoutUserEmailInContact.siret)
            .withUserRights([
              {
                role: "establishment-admin",
                job: "",
                phone: "",
                userId: user.id,
              },
            ])
            .build(),
        ];

        expectToEqual(
          await getDiscussionByIdForEstablishment.execute(
            discussionWithoutUserEmailInContact.id,
            {
              userId: user.id,
            },
          ),
          new DiscussionBuilder(
            discussionWithoutUserEmailInContact,
          ).buildRead(),
        );
      });

      it("user has establishment contact right", async () => {
        uow.establishmentAggregateRepository.establishmentAggregates = [
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(discussionWithoutUserEmailInContact.siret)
            .withUserRights([
              {
                role: "establishment-admin",
                job: "",
                phone: "",
                userId: "",
              },
              {
                role: "establishment-contact",
                job: "",
                phone: "",
                userId: user.id,
              },
            ])
            .build(),
        ];

        expectToEqual(
          await getDiscussionByIdForEstablishment.execute(
            discussionWithoutUserEmailInContact.id,
            {
              userId: user.id,
            },
          ),
          new DiscussionBuilder(
            discussionWithoutUserEmailInContact,
          ).buildRead(),
        );
      });
    });
  });
});
