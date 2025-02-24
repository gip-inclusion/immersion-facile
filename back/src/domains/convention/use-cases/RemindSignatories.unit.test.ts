import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  InclusionConnectDomainJwtPayload,
  InclusionConnectedUserBuilder,
  UserBuilder,
  conventionStatusesWithJustification,
  conventionStatusesWithValidator,
  createConventionMagicLinkPayload,
  errors,
  expectPromiseToFailWithError,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { RemindSignatories, makeRemindSignatories } from "./RemindSignatories";

const conventionId = "add5c20e-6dd2-45af-affe-927358005251";

const convention = new ConventionDtoBuilder()
  .withId(conventionId)
  .withStatus("READY_TO_SIGN")
  .build();

const agency = new AgencyDtoBuilder().withId(convention.agencyId).build();

const viewerJwtPayload = createConventionMagicLinkPayload({
  id: conventionId,
  role: "agency-viewer",
  email: "agency-viewer@mail.com",
  now: new Date(),
});

const notConnectedUser = new UserBuilder()
  .withEmail("validator@mail.com")
  .build();
const validatorJwtPayload = createConventionMagicLinkPayload({
  id: conventionId,
  role: "validator",
  email: notConnectedUser.email,
  now: new Date(),
});

const connectedUserPayload: InclusionConnectDomainJwtPayload = {
  userId: "bcc5c20e-6dd2-45cf-affe-927358005262",
};

const connectedUserBuilder = new InclusionConnectedUserBuilder().withId(
  connectedUserPayload.userId,
);
const connectedUser = connectedUserBuilder.build();

describe("RemindSignatories", () => {
  let uow: InMemoryUnitOfWork;
  let usecase: RemindSignatories;

  beforeEach(() => {
    uow = createInMemoryUow();
    usecase = makeRemindSignatories({
      uowPerformer: new InMemoryUowPerformer(uow),
    });
  });

  describe("Wrong paths", () => {
    it("throws bad request if requested convention does not match the one in jwt", async () => {
      const requestedConventionId = "1dd5c20e-6dd2-45af-affe-927358005250";

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId: requestedConventionId,
            role: "beneficiary-representative",
          },
          validatorJwtPayload,
        ),
        errors.convention.forbiddenMissingRights({
          conventionId: requestedConventionId,
        }),
      );
    });

    it("throws not found if convention does not exist", async () => {
      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId,
            role: "beneficiary-representative",
          },
          validatorJwtPayload,
        ),
        errors.convention.notFound({ conventionId }),
      );
    });

    it.each([
      "IN_REVIEW",
      ...conventionStatusesWithJustification,
      ...conventionStatusesWithValidator,
    ] as const)(
      "throws bad request if convention status %s does not allow reminder",
      async (conventionStatus) => {
        const draftConvention = new ConventionDtoBuilder()
          .withId(conventionId)
          .withStatus(conventionStatus)
          .build();
        uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
        uow.conventionRepository.setConventions([draftConvention]);

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId: draftConvention.id,
              role: "beneficiary-representative",
            },
            validatorJwtPayload,
          ),
          errors.convention.signReminderNotAllowedForStatus({
            status: draftConvention.status,
          }),
        );
      },
    );

    describe("from connected user", () => {
      it("throws not found if connected user id does not exist", async () => {
        const unexistingUserPayload: InclusionConnectDomainJwtPayload = {
          userId: "bcc5c20e-6dd2-45cf-affe-927358005267",
        };
        uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
        uow.conventionRepository.setConventions([convention]);

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              role: "beneficiary-representative",
            },
            unexistingUserPayload,
          ),
          errors.user.notFound(unexistingUserPayload),
        );
      });

      it("throws unauthorized if user has no rights on agency", async () => {
        uow.conventionRepository.setConventions([convention]);
        uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
        uow.userRepository.users = [connectedUser];

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              role: "beneficiary-representative",
            },
            connectedUserPayload,
          ),
          errors.user.noRightsOnAgency({
            userId: connectedUserPayload.userId,
            agencyId: convention.agencyId,
          }),
        );
      });

      it("throws unauthorized if user has not enough rights on agency", async () => {
        uow.conventionRepository.setConventions([convention]);
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [connectedUserPayload.userId]: {
              roles: ["agency-viewer"],
              isNotifiedByEmail: false,
            },
          }),
        ];
        uow.userRepository.users = [connectedUser];

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              role: "beneficiary-representative",
            },
            connectedUserPayload,
          ),
          errors.user.notEnoughRightOnAgency({
            userId: connectedUserPayload.userId,
            agencyId: convention.agencyId,
          }),
        );
      });
    });

    describe("from magiclink", () => {
      it("throws unauthorized if role in payload is not allowed to send sign reminder", async () => {
        uow.conventionRepository.setConventions([convention]);
        uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              role: "beneficiary-representative",
            },
            viewerJwtPayload,
          ),
          errors.convention.unsupportedRoleSignReminder({
            role: "agency-viewer",
          }),
        );
      });

      it("throws unauthorized if role in payload is valid but user has no actual rights on agency", async () => {
        uow.userRepository.users = [notConnectedUser];
        uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];

        uow.conventionRepository.setConventions([convention]);

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              role: "beneficiary-representative",
            },
            validatorJwtPayload,
          ),
          errors.user.notEnoughRightOnAgency({
            agencyId: agency.id,
          }),
        );
      });

      it("throws unauthorized if user has not enough rights on agency", async () => {
        uow.userRepository.users = [notConnectedUser];
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [notConnectedUser.id]: {
              roles: ["agency-viewer"],
              isNotifiedByEmail: false,
            },
          }),
        ];

        uow.conventionRepository.setConventions([convention]);

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              role: "beneficiary-representative",
            },
            validatorJwtPayload,
          ),
          errors.user.notEnoughRightOnAgency({
            agencyId: agency.id,
          }),
        );
      });
    });

    it("throws too many requests if there was already a reminder less than 24h before", () => {});

    it("throws bad request if phone number format %s is incorrect", async () => {
      const conventionWithIncorrectPhoneFormat = new ConventionDtoBuilder(
        convention,
      )
        .withBeneficiaryPhone("+3300000000")
        .withBeneficiarySignedAt(undefined)
        .build();
      uow.conventionRepository.setConventions([
        conventionWithIncorrectPhoneFormat,
      ]);
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [notConnectedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
        }),
      ];
      uow.userRepository.users = [notConnectedUser];

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId,
            role: "beneficiary",
          },
          validatorJwtPayload,
        ),
        errors.convention.invalidMobilePhoneNumber({
          conventionId: conventionWithIncorrectPhoneFormat.id,
          signatoryRole: "beneficiary",
        }),
      );
    });

    it("throws bad request if reminded signatory has already signed", async () => {
      const conventionAlreadySigned = new ConventionDtoBuilder(convention)
        .withBeneficiaryPhone("+33600000000")
        .withBeneficiarySignedAt(new Date())
        .build();
      uow.conventionRepository.setConventions([conventionAlreadySigned]);
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [notConnectedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        }),
      ];
      uow.userRepository.users = [notConnectedUser];

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId,
            role: "beneficiary",
          },
          validatorJwtPayload,
        ),
        errors.convention.signatoryAlreadySigned({
          conventionId: conventionAlreadySigned.id,
          signatoryRole: "beneficiary",
        }),
      );
    });
  });

  describe("Right paths: send sms reminder", () => {
    // for magic link and connected user
    // for validator and counsellor
    //phone number valid
    it.each(["+33600000000", "+33700000000", "+262692000000"])(
      "for phone number %s",
      (phoneNumber) => {},
    );
  });
});
