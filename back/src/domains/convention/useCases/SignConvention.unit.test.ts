import {
  BeneficiaryRepresentative,
  ConventionDto,
  ConventionDtoBuilder,
  ConventionId,
  ConventionStatus,
  EstablishmentRepresentative,
  InclusionConnectedUser,
  Signatories,
  allRoles,
  allSignatoryRoles,
  conventionStatuses,
  expectPromiseToFailWithError,
  expectToEqual,
  splitCasesBetweenPassingAndFailing,
} from "shared";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { DomainEvent } from "../../core/events/events";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { SignConvention } from "./SignConvention";

const beneficiaryRepresentative: BeneficiaryRepresentative = {
  role: "beneficiary-representative",
  email: "bob@email.com",
  phone: "0665565432",
  firstName: "Bob",
  lastName: "L'éponge",
};

const establishmentRepresentative: EstablishmentRepresentative = {
  role: "establishment-representative",
  email: "patron@email.com",
  phone: "0665565432",
  firstName: "Pa",
  lastName: "Tron",
};

describe("Sign convention", () => {
  let uow: InMemoryUnitOfWork;
  let signConvention: SignConvention;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    const uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({
      timeGateway,
      uuidGenerator,
    });

    signConvention = new SignConvention(
      new InMemoryUowPerformer(uow),
      createNewEvent,
      timeGateway,
    );
  });

  const [allowedToSignRoles, forbiddenToSignRoles] =
    splitCasesBetweenPassingAndFailing(allRoles, allSignatoryRoles);

  const allowedRole = allRoles[0];

  const [allowedInitialStatuses, forbiddenInitialStatuses] =
    splitCasesBetweenPassingAndFailing(conventionStatuses, [
      "READY_TO_SIGN",
      "PARTIALLY_SIGNED",
    ]);

  describe("wrong paths", () => {
    it("Convention cannot be signed if it is not found in DB", async () => {
      await expectPromiseToFailWithError(
        signConvention.execute(
          { conventionId },
          {
            role: allowedRole,
            applicationId: conventionId,
            emailHash: "toto",
          },
        ),
        new NotFoundError("add5c20e-6dd2-45af-affe-927358005251"),
      );
    });

    describe("forbidden roles with convention jwt", () => {
      it.each(forbiddenToSignRoles.map((role) => ({ role })))(
        "$role is not allowed to sign",
        async ({ role }) => {
          const convention = prepareConventionWithStatus("READY_TO_SIGN");
          uow.conventionRepository.setConventions([convention]);
          await expectPromiseToFailWithError(
            signConvention.execute(
              { conventionId },
              {
                role,
                applicationId: conventionId,
                emailHash: "toto",
              },
            ),
            new ForbiddenError(
              "Only Beneficiary, his current employer, his legal representative or the establishment representative are allowed to sign convention",
            ),
          );
        },
      );
    });

    describe("with convention inclusion connect jwt", () => {
      it("wh IC user is not establishment rep", async () => {
        const conventionInDb = prepareConventionWithStatus("READY_TO_SIGN");
        uow.conventionRepository.setConventions([conventionInDb]);
        const icUser: InclusionConnectedUser = {
          agencyRights: [],
          establishmentDashboards: {},
          email: "other@mail.com",
          firstName: "Billy",
          lastName: "Idol",
          id: "id",
          externalId: "billy-external-id",
        };
        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
          icUser,
        ]);
        const signedAt = new Date("2022-01-01");
        timeGateway.setNextDate(signedAt);

        await expectPromiseToFailWithError(
          signConvention.execute(
            { conventionId },
            {
              userId: icUser.id,
            },
          ),
          new ForbiddenError(
            "Only Beneficiary, his current employer, his legal representative or the establishment representative are allowed to sign convention",
          ),
        );
      });
    });

    describe("bad statuses", () => {
      it.each(
        forbiddenInitialStatuses.map((initialStatus) => ({ initialStatus })),
      )(
        "$initialStatus initial status is not allowed",
        async ({ initialStatus }) => {
          const conventionInDb = prepareConventionWithStatus(initialStatus);
          uow.conventionRepository.setConventions([conventionInDb]);

          await expectPromiseToFailWithError(
            signConvention.execute(
              { conventionId },
              {
                role: allowedRole,
                applicationId: conventionId,
                emailHash: "toto",
              },
            ),
            new BadRequestError(
              `Cannot go from status '${initialStatus}' to 'PARTIALLY_SIGNED'`,
            ),
          );
        },
      );
    });
  });

  describe("happy paths", () => {
    describe("with convention jwt", () => {
      it.each(allowedToSignRoles.map((role) => ({ role })))(
        "updates the convention with new signature for $role",
        async ({ role }) => {
          const conventionInDb = prepareConventionWithStatus("READY_TO_SIGN");
          uow.conventionRepository.setConventions([conventionInDb]);
          const signedAt = new Date("2022-01-01");
          timeGateway.setNextDate(signedAt);

          await signConvention.execute(
            { conventionId },
            {
              role,
              applicationId: conventionId,
              emailHash: "toto",
            },
          );

          expectToEqual(uow.conventionRepository.conventions, [
            {
              ...conventionInDb,
              status: "PARTIALLY_SIGNED",
              signatories: makeSignatories(conventionInDb, {
                establishmentRepresentativeSignedAt:
                  role === "establishment-representative"
                    ? signedAt.toISOString()
                    : undefined,
                beneficiarySignedAt:
                  role === "beneficiary" ? signedAt.toISOString() : undefined,
                beneficiaryCurrentEmployerSignedAt:
                  role === "beneficiary-current-employer"
                    ? signedAt.toISOString()
                    : undefined,
                beneficiaryRepresentativeSignedAt:
                  role === "beneficiary-representative"
                    ? signedAt.toISOString()
                    : undefined,
              }),
            },
          ]);
        },
      );
    });

    describe("with inclusion connect jwt", () => {
      it("updates the convention with new signature for IC user when user is establisment representative", async () => {
        const conventionInDb = prepareConventionWithStatus("READY_TO_SIGN");
        uow.conventionRepository.setConventions([conventionInDb]);
        const icUser: InclusionConnectedUser = {
          agencyRights: [],
          establishmentDashboards: {},
          email: conventionInDb.signatories.establishmentRepresentative.email,
          firstName: "Billy",
          lastName: "Idol",
          id: "id",
          externalId: "billy-external-id",
        };
        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
          icUser,
        ]);
        const signedAt = new Date("2022-01-01");
        timeGateway.setNextDate(signedAt);

        await signConvention.execute(
          { conventionId },
          {
            userId: icUser.id,
          },
        );

        expectToEqual(uow.conventionRepository.conventions, [
          {
            ...conventionInDb,
            status: "PARTIALLY_SIGNED",
            signatories: makeSignatories(conventionInDb, {
              establishmentRepresentativeSignedAt: signedAt.toISOString(),
            }),
          },
        ]);
      });
    });

    describe("convention status transitions", () => {
      it("goes from status READY_TO_SIGN to PARTIALLY_SIGNED, and saves corresponding event", async () => {
        expectAllowedInitialStatus("READY_TO_SIGN");
        const initialConvention = prepareConventionWithStatus("READY_TO_SIGN");
        uow.conventionRepository.setConventions([initialConvention]);
        const signedAt = new Date("2022-01-01");
        timeGateway.setNextDate(signedAt);

        await signConvention.execute(
          { conventionId },
          {
            role: "establishment-representative",
            applicationId: initialConvention.id,
            emailHash: "toto",
          },
        );

        const expectedConvention: ConventionDto = {
          ...initialConvention,
          status: "PARTIALLY_SIGNED",
          signatories: makeSignatories(initialConvention, {
            establishmentRepresentativeSignedAt: signedAt.toISOString(),
          }),
        };
        expectToEqual(uow.conventionRepository.conventions, [
          expectedConvention,
        ]);
        expectEventsInOutbox([
          {
            topic: "ConventionPartiallySigned",
            payload: { convention: expectedConvention },
          },
        ]);
      });

      it("goes from status PARTIALLY_SIGNED to PARTIALLY_SIGNED, and saves corresponding event", async () => {
        expectAllowedInitialStatus("PARTIALLY_SIGNED");
        const beneficiarySignedAt = new Date("2022-01-02");
        const initialConvention = new ConventionDtoBuilder()
          .withId(conventionId)
          .withStatus("PARTIALLY_SIGNED")
          .withBeneficiaryRepresentative(beneficiaryRepresentative)
          .notSigned()
          .signedByBeneficiary(beneficiarySignedAt.toISOString())
          .build();

        uow.conventionRepository.setConventions([initialConvention]);

        const establishmentRepresentativeSignedAt = new Date("2022-01-01");
        timeGateway.setNextDate(establishmentRepresentativeSignedAt);

        await signConvention.execute(
          { conventionId },
          {
            role: "establishment-representative",
            applicationId: initialConvention.id,
            emailHash: "toto",
          },
        );

        const expectedConvention: ConventionDto = {
          ...initialConvention,
          status: "PARTIALLY_SIGNED",
          signatories: makeSignatories(initialConvention, {
            beneficiarySignedAt: beneficiarySignedAt.toISOString(),
            establishmentRepresentativeSignedAt:
              establishmentRepresentativeSignedAt.toISOString(),
          }),
        };

        expectToEqual(
          expectedConvention.signatories.beneficiaryRepresentative,
          beneficiaryRepresentative,
        );
        expectToEqual(uow.conventionRepository.conventions, [
          expectedConvention,
        ]);
        expectEventsInOutbox([
          {
            topic: "ConventionPartiallySigned",
            payload: { convention: expectedConvention },
          },
        ]);
      });

      it("With 2 signatories, goes from status PARTIALLY_SIGNED to IN_REVIEW, and saves corresponding event", async () => {
        expectAllowedInitialStatus("PARTIALLY_SIGNED");
        const beneficiarySignedAt = new Date("2022-01-02");
        const initialConvention = new ConventionDtoBuilder()
          .withId(conventionId)
          .withStatus("PARTIALLY_SIGNED")
          .notSigned()
          .signedByBeneficiary(beneficiarySignedAt.toISOString())
          .build();

        uow.conventionRepository.setConventions([initialConvention]);

        const establishmentRepresentativeSignedAt = new Date("2022-01-01");
        timeGateway.setNextDate(establishmentRepresentativeSignedAt);

        await signConvention.execute(
          { conventionId },
          {
            role: "establishment-representative",
            applicationId: initialConvention.id,
            emailHash: "toto",
          },
        );

        const expectedConvention: ConventionDto = {
          ...initialConvention,
          status: "IN_REVIEW",
          signatories: makeSignatories(initialConvention, {
            beneficiarySignedAt: beneficiarySignedAt.toISOString(),
            establishmentRepresentativeSignedAt:
              establishmentRepresentativeSignedAt.toISOString(),
          }),
        };
        expectToEqual(uow.conventionRepository.conventions, [
          expectedConvention,
        ]);
        expectEventsInOutbox([
          {
            topic: "ConventionFullySigned",
            payload: { convention: expectedConvention },
          },
        ]);
      });
    });
  });

  const conventionId: ConventionId = "add5c20e-6dd2-45af-affe-927358005251";
  const prepareConventionWithStatus = (status: ConventionStatus) =>
    new ConventionDtoBuilder()
      .withId(conventionId)
      .withStatus(status)
      .withBeneficiaryRepresentative(beneficiaryRepresentative)
      .withEstablishmentRepresentative(establishmentRepresentative)
      .notSigned()
      .build();

  const expectAllowedInitialStatus = (status: ConventionStatus) =>
    expect(allowedInitialStatuses.includes(status)).toBeTruthy();

  const expectEventsInOutbox = (events: Partial<DomainEvent>[]) => {
    expect(uow.outboxRepository.events).toMatchObject(events);
  };
});

const makeSignatories = (
  convention: ConventionDto,
  {
    establishmentRepresentativeSignedAt,
    beneficiarySignedAt,
    beneficiaryRepresentativeSignedAt,
    beneficiaryCurrentEmployerSignedAt,
  }: {
    establishmentRepresentativeSignedAt?: string;
    beneficiarySignedAt?: string;
    beneficiaryRepresentativeSignedAt?: string;
    beneficiaryCurrentEmployerSignedAt?: string;
  },
): Signatories => ({
  ...convention.signatories,
  beneficiary: {
    ...convention.signatories.beneficiary,
    signedAt: beneficiarySignedAt,
  },
  beneficiaryRepresentative:
    beneficiaryRepresentativeSignedAt &&
    convention.signatories.beneficiaryRepresentative
      ? {
          ...convention.signatories.beneficiaryRepresentative,
          signedAt: beneficiaryRepresentativeSignedAt,
        }
      : convention.signatories.beneficiaryRepresentative,
  beneficiaryCurrentEmployer: convention.signatories.beneficiaryCurrentEmployer
    ? {
        ...convention.signatories.beneficiaryCurrentEmployer,
        signedAt: beneficiaryCurrentEmployerSignedAt,
      }
    : convention.signatories.beneficiaryCurrentEmployer,
  establishmentRepresentative: {
    ...convention.signatories.establishmentRepresentative,
    signedAt: establishmentRepresentativeSignedAt,
  },
});
