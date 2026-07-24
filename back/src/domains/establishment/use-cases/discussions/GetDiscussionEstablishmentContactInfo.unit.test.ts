import {
  ConnectedUserBuilder,
  DiscussionBuilder,
  defaultAddress,
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
import {
  type GetDiscussionEstablishmentContactInfo,
  makeGetDiscussionEstablishmentContactInfo,
} from "./GetDiscussionEstablishmentContactInfo";

describe("GetDiscussionEstablishmentContactInfo", () => {
  const establishmentAdmin = new ConnectedUserBuilder()
    .withId(uuid())
    .withEmail("admin@admin.com")
    .buildUser();
  const establishmentContact = new ConnectedUserBuilder()
    .withId(uuid())
    .buildUser();
  const pendingUser = new ConnectedUserBuilder().withId(uuid()).buildUser();
  const discussion = new DiscussionBuilder().withId(uuid()).build();
  const potentialBeneficiaryUser = new ConnectedUserBuilder()
    .withId(uuid())
    .withEmail(discussion.potentialBeneficiary.email)
    .buildUser();
  const userWithNoRightsAndDiscussion = new ConnectedUserBuilder()
    .withId(uuid())
    .withEmail("user@useless.com")
    .buildUser();

  let getDiscussionEstablishmentContactInfo: GetDiscussionEstablishmentContactInfo;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    getDiscussionEstablishmentContactInfo =
      makeGetDiscussionEstablishmentContactInfo({
        uowPerformer: new InMemoryUowPerformer(uow),
      });
    uow.userRepository.users = [
      establishmentAdmin,
      establishmentContact,
      pendingUser,
      potentialBeneficiaryUser,
      userWithNoRightsAndDiscussion,
    ];
    uow.discussionRepository.discussions = [discussion];
    uow.establishmentAggregateRepository.establishmentAggregates = [
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret(discussion.siret)
        .withEstablishmentWelcomeAddress(defaultAddress.addressAndPosition)
        .withUserRights([
          {
            role: "establishment-admin",
            status: "ACCEPTED",
            job: "",
            phone: "+33600000001",
            userId: establishmentAdmin.id,
            shouldReceiveDiscussionNotifications: false,
            isMainContactByPhone: false,
          },
          {
            role: "establishment-contact",
            status: "ACCEPTED",
            userId: establishmentContact.id,
            shouldReceiveDiscussionNotifications: false,
          },
          {
            role: "establishment-contact",
            status: "PENDING",
            userId: pendingUser.id,
            shouldReceiveDiscussionNotifications: false,
          },
        ])
        .build(),
    ];
  });

  describe("Wrong paths", () => {
    it("throws when user cannot be found", async () => {
      uow.userRepository.users = [];
      await expectPromiseToFailWithError(
        getDiscussionEstablishmentContactInfo.execute(discussion.id, {
          userId: establishmentAdmin.id,
        }),
        errors.user.notFound({ userId: establishmentAdmin.id }),
      );
    });

    it("throws when discussion cannot be found", async () => {
      const missingDiscussionId = uuid();

      await expectPromiseToFailWithError(
        getDiscussionEstablishmentContactInfo.execute(missingDiscussionId, {
          userId: establishmentAdmin.id,
        }),
        errors.discussion.notFound({ discussionId: missingDiscussionId }),
      );
    });

    it("throws when user has no establishment right and is not potential beneficiary", async () => {
      await expectPromiseToFailWithError(
        getDiscussionEstablishmentContactInfo.execute(discussion.id, {
          userId: userWithNoRightsAndDiscussion.id,
        }),
        errors.discussion.accessForbidden({
          discussionId: discussion.id,
          userId: userWithNoRightsAndDiscussion.id,
        }),
      );
    });

    it("throws when user has pending establishment rights and is not potential beneficiary", async () => {
      await expectPromiseToFailWithError(
        getDiscussionEstablishmentContactInfo.execute(discussion.id, {
          userId: pendingUser.id,
        }),
        errors.discussion.accessForbidden({
          discussionId: discussion.id,
          userId: pendingUser.id,
        }),
      );
    });

    it("throws when establishment cannot be found", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [];

      await expectPromiseToFailWithError(
        getDiscussionEstablishmentContactInfo.execute(discussion.id, {
          userId: potentialBeneficiaryUser.id,
        }),
        errors.establishment.notFound({ siret: discussion.siret }),
      );
    });

    it("throw when establishment has no accepted admin rights", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(discussion.siret)
          .withEstablishmentWelcomeAddress(defaultAddress.addressAndPosition)
          .withUserRights([
            {
              role: "establishment-admin",
              status: "PENDING",
              job: "",
              phone: "+33600000001",
              userId: establishmentAdmin.id,
              shouldReceiveDiscussionNotifications: false,
              isMainContactByPhone: false,
            },
            {
              role: "establishment-contact",
              status: "ACCEPTED",
              userId: establishmentContact.id,
              shouldReceiveDiscussionNotifications: false,
            },
          ])
          .build(),
      ];

      await expectPromiseToFailWithError(
        getDiscussionEstablishmentContactInfo.execute(discussion.id, {
          userId: potentialBeneficiaryUser.id,
        }),
        errors.establishment.adminNotFound({ siret: discussion.siret }),
      );
    });
  });

  describe("Right paths", () => {
    it("returns establishment additional information for potential beneficiary", async () => {
      expectToEqual(
        await getDiscussionEstablishmentContactInfo.execute(discussion.id, {
          userId: potentialBeneficiaryUser.id,
        }),
        {
          siret: discussion.siret,
          potentialBeneficiaryWelcomeAddress: defaultAddress.addressAndPosition,
          mainContact: {
            firstName: establishmentAdmin.firstName,
            lastName: establishmentAdmin.lastName,
            phone: "+33600000001",
          },
        },
      );
    });

    it("returns establishment additional information for establishment admin user", async () => {
      expectToEqual(
        await getDiscussionEstablishmentContactInfo.execute(discussion.id, {
          userId: establishmentAdmin.id,
        }),
        {
          siret: discussion.siret,
          potentialBeneficiaryWelcomeAddress: defaultAddress.addressAndPosition,
          mainContact: {
            firstName: establishmentAdmin.firstName,
            lastName: establishmentAdmin.lastName,
            phone: "+33600000001",
          },
        },
      );
    });

    it("returns establishment additional information even when establishment contactMode differs from discussion contactMode", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(discussion.siret)
          .withEstablishmentWelcomeAddress(defaultAddress.addressAndPosition)
          .withContactMode("PHONE")
          .withUserRights([
            {
              role: "establishment-admin",
              status: "ACCEPTED",
              job: "",
              phone: "+33600000001",
              userId: establishmentAdmin.id,
              shouldReceiveDiscussionNotifications: false,
              isMainContactByPhone: false,
            },
          ])
          .build(),
      ];

      expectToEqual(
        await getDiscussionEstablishmentContactInfo.execute(discussion.id, {
          userId: potentialBeneficiaryUser.id,
        }),
        {
          siret: discussion.siret,
          potentialBeneficiaryWelcomeAddress: defaultAddress.addressAndPosition,
          mainContact: {
            firstName: establishmentAdmin.firstName,
            lastName: establishmentAdmin.lastName,
            phone: "+33600000001",
          },
        },
      );
    });

    it("returns establishment additional information for establishment contact user", async () => {
      expectToEqual(
        await getDiscussionEstablishmentContactInfo.execute(discussion.id, {
          userId: establishmentContact.id,
        }),
        {
          siret: discussion.siret,
          potentialBeneficiaryWelcomeAddress: defaultAddress.addressAndPosition,
          mainContact: {
            firstName: establishmentAdmin.firstName,
            lastName: establishmentAdmin.lastName,
            phone: "+33600000001",
          },
        },
      );
    });

    it("returns the admin with isMainContactByPhone when several admins exist", async () => {
      const secondAdmin = new ConnectedUserBuilder()
        .withId(uuid())
        .withFirstName("Jean")
        .withLastName("Dupont")
        .buildUser();
      uow.userRepository.users = [...uow.userRepository.users, secondAdmin];
      uow.establishmentAggregateRepository.establishmentAggregates = [
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(discussion.siret)
          .withEstablishmentWelcomeAddress(defaultAddress.addressAndPosition)
          .withUserRights([
            {
              role: "establishment-admin",
              status: "ACCEPTED",
              job: "",
              phone: "+33600000001",
              userId: establishmentAdmin.id,
              shouldReceiveDiscussionNotifications: false,
              isMainContactByPhone: false,
            },
            {
              role: "establishment-admin",
              status: "ACCEPTED",
              job: "",
              phone: "+33600000002",
              userId: secondAdmin.id,
              shouldReceiveDiscussionNotifications: false,
              isMainContactByPhone: true,
            },
          ])
          .build(),
      ];

      expectToEqual(
        await getDiscussionEstablishmentContactInfo.execute(discussion.id, {
          userId: potentialBeneficiaryUser.id,
        }),
        {
          siret: discussion.siret,
          potentialBeneficiaryWelcomeAddress: defaultAddress.addressAndPosition,
          mainContact: {
            firstName: secondAdmin.firstName,
            lastName: secondAdmin.lastName,
            phone: "+33600000002",
          },
        },
      );
    });

    it("returns the first admin in the list when none has isMainContactByPhone", async () => {
      const secondAdmin = new ConnectedUserBuilder()
        .withId(uuid())
        .withFirstName("Jean")
        .withLastName("Dupont")
        .buildUser();
      uow.userRepository.users = [...uow.userRepository.users, secondAdmin];
      uow.establishmentAggregateRepository.establishmentAggregates = [
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(discussion.siret)
          .withEstablishmentWelcomeAddress(defaultAddress.addressAndPosition)
          .withUserRights([
            {
              role: "establishment-admin",
              status: "ACCEPTED",
              job: "",
              phone: "+33600000001",
              userId: establishmentAdmin.id,
              shouldReceiveDiscussionNotifications: false,
              isMainContactByPhone: false,
            },
            {
              role: "establishment-admin",
              status: "ACCEPTED",
              job: "",
              phone: "+33600000002",
              userId: secondAdmin.id,
              shouldReceiveDiscussionNotifications: false,
              isMainContactByPhone: false,
            },
          ])
          .build(),
      ];

      expectToEqual(
        await getDiscussionEstablishmentContactInfo.execute(discussion.id, {
          userId: potentialBeneficiaryUser.id,
        }),
        {
          siret: discussion.siret,
          potentialBeneficiaryWelcomeAddress: defaultAddress.addressAndPosition,
          mainContact: {
            firstName: establishmentAdmin.firstName,
            lastName: establishmentAdmin.lastName,
            phone: "+33600000001",
          },
        },
      );
    });
  });
});
