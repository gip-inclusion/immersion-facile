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
  const establishmentAdmin = new ConnectedUserBuilder()
    .withId(uuid())
    .buildUser();
  const establishmentContact = new ConnectedUserBuilder()
    .withId(uuid())
    .buildUser();
  const discussion = new DiscussionBuilder().withId(uuid()).build();

  let getDiscussionByIdForEstablishment: GetDiscussionByIdForEstablishment;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    getDiscussionByIdForEstablishment = new GetDiscussionByIdForEstablishment(
      new InMemoryUowPerformer(uow),
    );
    uow.userRepository.users = [establishmentAdmin, establishmentContact];
    uow.discussionRepository.discussions = [discussion];
    uow.establishmentAggregateRepository.establishmentAggregates = [
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret(discussion.siret)
        .withUserRights([
          {
            role: "establishment-admin",
            job: "",
            phone: "",
            userId: establishmentAdmin.id,
            shouldReceiveDiscussionNotifications: false,
          },
          {
            role: "establishment-contact",
            userId: establishmentContact.id,
            shouldReceiveDiscussionNotifications: false,
          },
        ])
        .build(),
    ];
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
        uow.userRepository.users = [];
        await expectPromiseToFailWithError(
          getDiscussionByIdForEstablishment.execute(discussion.id, {
            userId: establishmentAdmin.id,
          }),
          errors.user.notFound({ userId: establishmentAdmin.id }),
        );
      });

      it("when discussion cannot be found", async () => {
        const missingDiscussionId = uuid();

        await expectPromiseToFailWithError(
          getDiscussionByIdForEstablishment.execute(missingDiscussionId, {
            userId: establishmentAdmin.id,
          }),
          errors.discussion.notFound({ discussionId: missingDiscussionId }),
        );
      });

      it("when missing establishment", async () => {
        uow.establishmentAggregateRepository.establishmentAggregates = [];

        await expectPromiseToFailWithError(
          getDiscussionByIdForEstablishment.execute(discussion.id, {
            userId: establishmentAdmin.id,
          }),
          errors.establishment.notFound({
            siret: discussion.siret,
          }),
        );
      });
    });

    it("throws accessForbidden when user have no rights on establishment", async () => {
      const userWithNoRight = new ConnectedUserBuilder()
        .withId(uuid())
        .buildUser();

      uow.userRepository.users = [userWithNoRight];

      await expectPromiseToFailWithError(
        getDiscussionByIdForEstablishment.execute(discussion.id, {
          userId: userWithNoRight.id,
        }),
        errors.discussion.accessForbidden({
          discussionId: discussion.id,
          userId: userWithNoRight.id,
        }),
      );
    });
  });

  describe("Right paths", () => {
    describe("Discussion with kinds and methods", () => {
      it.each([
        new DiscussionBuilder(discussion)
          .withDiscussionKind("IF")
          .withContactMode("EMAIL")
          .build(),
        new DiscussionBuilder(discussion)
          .withDiscussionKind("IF")
          .withContactMode("IN_PERSON")
          .build(),
        new DiscussionBuilder(discussion)
          .withDiscussionKind("IF")
          .withContactMode("PHONE")
          .build(),
        new DiscussionBuilder(discussion)
          .withDiscussionKind("1_ELEVE_1_STAGE")
          .withContactMode("EMAIL")
          .build(),
        new DiscussionBuilder(discussion)
          .withDiscussionKind("1_ELEVE_1_STAGE")
          .withContactMode("IN_PERSON")
          .build(),
        new DiscussionBuilder(discussion)
          .withDiscussionKind("1_ELEVE_1_STAGE")
          .withContactMode("PHONE")
          .build(),
      ])(
        "Gets discussion with kind $kind and contact mode $contactMode based on establishment contact email",
        async (discussion) => {
          uow.discussionRepository.discussions = [discussion];

          expectToEqual(
            await getDiscussionByIdForEstablishment.execute(discussion.id, {
              userId: establishmentAdmin.id,
            }),
            new DiscussionBuilder(discussion).buildRead(),
          );
        },
      );
    });

    describe("user has rights on discussion's establishment", () => {
      it("user has establishment admin right", async () => {
        expectToEqual(
          await getDiscussionByIdForEstablishment.execute(discussion.id, {
            userId: establishmentAdmin.id,
          }),
          new DiscussionBuilder(discussion).buildRead(),
        );
      });

      it("user has establishment contact right", async () => {
        expectToEqual(
          await getDiscussionByIdForEstablishment.execute(discussion.id, {
            userId: establishmentContact.id,
          }),
          new DiscussionBuilder(discussion).buildRead(),
        );
      });
    });
  });
});
