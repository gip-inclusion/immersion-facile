import { makeRemindSignatories, RemindSignatories } from "./RemindSignatories";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  ConventionDtoBuilder,
  conventionStatusesWithJustification,
  conventionStatusesWithValidator,
  createConventionMagicLinkPayload,
  errors,
  expectPromiseToFailWithError,
  InclusionConnectedUserBuilder,
} from "shared";

const conventionId = "add5c20e-6dd2-45af-affe-927358005251";

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

const connectedUserPayload = {
  userId: "bcc5c20e-6dd2-45cf-affe-927358005262",
};

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
    it("throws bad request if requested convention does not match the one in jwt", async () => {});

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
      it("throws unauthorized if user has no rights on agency", async () => {
        const convention = new ConventionDtoBuilder()
          .withId(conventionId)
          .withStatus("READY_TO_SIGN")
          .build();
        uow.conventionRepository.setConventions([convention]);

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              role: "beneficiary-representative",
            },
            connectedUserPayload
          ),
          errors.convention.notFound({ conventionId })
        );
      });

      it("throws unauthorized if user has not enough rights on agency", () => {});
    });

    describe("from magiclink", () => {
      it("throws unauthorized if user has no rights on agency", async () => {
        const convention = new ConventionDtoBuilder()
          .withId(conventionId)
          .withStatus("READY_TO_SIGN")
          .build();
        uow.conventionRepository.setConventions([convention]);

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              role: "beneficiary-representative",
            },
            viewerJwtPayload
          ),
          errors.convention.notFound({ conventionId })
        );
      });

      it("throws unauthorized if user has not enough rights on agency", () => {});
    });

    it("throws too many requests if there was already a reminder less than 24h before", () => {});

    it("throws bad request if phone number format is incorrect", () => {});

    it("throws bad request if reminded signatory has already signed", () => {});
  });

  describe("Right paths", () => {
    it("send sms reminder", () => {});
  });
});
