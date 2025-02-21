import { makeRemindSignatories, RemindSignatories } from "./RemindSignatories";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  conventionStatusesWithJustification,
  conventionStatusesWithValidator,
  createConventionMagicLinkPayload,
  errors,
  expectPromiseToFailWithError, InclusionConnectDomainJwtPayload,
  InclusionConnectedUserBuilder,
} from "shared";
import {toAgencyWithRights} from "../../../utils/agency";

const conventionId = "add5c20e-6dd2-45af-affe-927358005251";
const convention = new ConventionDtoBuilder()
  .withId(conventionId)
  .withStatus("READY_TO_SIGN")
  .build();

const viewerJwtPayload = createConventionMagicLinkPayload({
  id: conventionId,
  role: "agency-viewer",
  email: "agency-viewer@mail.com",
  now: new Date(),
});

const validatorJwtPayload = createConventionMagicLinkPayload({
  id: conventionId,
  role: "validator",
  email: "validator@mail.com",
  now: new Date(),
});

const connectedUserPayload: InclusionConnectDomainJwtPayload = {
  userId: "bcc5c20e-6dd2-45cf-affe-927358005262",
};

const connectedUserBuilder = new InclusionConnectedUserBuilder()
  .withId(connectedUserPayload.userId);
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
          validatorJwtPayload
        ),
        errors.convention.forbiddenMissingRights({
          conventionId: requestedConventionId,
        })
      );
    });

    it("throws not found if convention does not exist", async () => {
      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId,
            role: "beneficiary-representative",
          },
          validatorJwtPayload
        ),
        errors.convention.notFound({ conventionId })
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

        uow.conventionRepository.setConventions([draftConvention]);

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId: draftConvention.id,
              role: "beneficiary-representative",
            },
            validatorJwtPayload
          ),
          errors.convention.signReminderNotAllowedForStatus({
            status: draftConvention.status,
          })
        );
      }
    );

    describe("from connected user", () => {
      it("throws not found if connected user id does not exist", async () => {
        const unexistingUserPayload: InclusionConnectDomainJwtPayload = { userId: "bcc5c20e-6dd2-45cf-affe-927358005267" }
        uow.conventionRepository.setConventions([convention]);

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              role: "beneficiary-representative",
            },
            unexistingUserPayload
          ),
          errors.user.notFound(unexistingUserPayload)
        );
      });

      it("throws unauthorized if user has no rights on agency", async () => {
        uow.conventionRepository.setConventions([convention]);
        uow.userRepository.users = [connectedUser];

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              role: "beneficiary-representative",
            },
            connectedUserPayload
          ),
          errors.user.noRightsOnAgency({ userId: connectedUserPayload.userId, agencyId: convention.agencyId })
        );
      });

      it("throws unauthorized if user has not enough rights on agency", async () => {
        const agency = new AgencyDtoBuilder().withId(convention.agencyId).build();
        uow.conventionRepository.setConventions([convention]);
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [connectedUserPayload.userId]: { roles: ["agency-viewer"], isNotifiedByEmail: false },
          }),
        ];
        uow.userRepository.users = [connectedUser];

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              role: "beneficiary-representative",
            },
            connectedUserPayload
          ),
          errors.user.noRightsOnAgency({ userId: connectedUserPayload.userId, agencyId: convention.agencyId })
        );
      });
    });

    describe("from magiclink", () => {
      it("throws unauthorized if user has no rights on agency", async () => {
        uow.conventionRepository.setConventions([convention]);

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              role: "beneficiary-representative",
            },
            viewerJwtPayload
          ),
          errors.convention.unsupportedRoleSignReminder({
            role: "agency-viewer",
          })
        );
      });

      it("throws unauthorized if user has not enough rights on agency", () => {});
    });

    it("throws too many requests if there was already a reminder less than 24h before", () => {});

    it("throws bad request if phone number format is incorrect", () => {});

    it("throws bad request if reminded signatory has already signed", () => {});
  });

  describe("Right paths", () => {
    // for magic link and connected user
    // for validator and counsellor
    it("send sms reminder", () => {});
  });
});
