import {
  allConventionStatuses,
  allRoles,
  ConventionDto,
  ConventionDtoBuilder,
  ConventionMagicLinkPayload,
  ConventionStatus,
  expectToEqual,
  BeneficiaryRepresentative,
  Role,
  Signatories,
  EstablishmentRepresentative,
  expectPromiseToFailWithError,
  splitCasesBetweenPassingAndFailing,
} from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainEvent } from "../../core/eventBus/events";
import { SignConvention } from "./SignConvention";

const beneficiaryRepresentative: BeneficiaryRepresentative = {
  role: "legal-representative",
  email: "bob@email.com",
  phone: "0665565432",
  firstName: "Bob",
  lastName: "L'éponge",
};

const establishmentRepresentative: EstablishmentRepresentative = {
  role: "establishment",
  email: "patron@email.com",
  phone: "0665565432",
  firstName: "Pa",
  lastName: "Tron",
};

describe("Sign convention", () => {
  let conventionRepository: InMemoryConventionRepository;
  let outboxRepository: InMemoryOutboxRepository;
  let signConvention: SignConvention;
  let clock: CustomClock;

  beforeEach(() => {
    const uow = createInMemoryUow();
    conventionRepository = uow.conventionRepository;
    outboxRepository = uow.outboxRepository;

    clock = new CustomClock();
    const uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

    signConvention = new SignConvention(
      new InMemoryUowPerformer(uow),
      createNewEvent,
      clock,
    );
  });

  const [allowedToSignRoles, forbiddenToSignRoles] =
    splitCasesBetweenPassingAndFailing<Role>(allRoles, [
      "beneficiary",
      "establishment-representative",
      "establishment",
      "legal-representative",
      "beneficiary-representative",
    ]);

  it.each(forbiddenToSignRoles.map((role) => ({ role })))(
    "$role is not allowed to sign",
    async ({ role }) => {
      await expectPromiseToFailWithError(
        triggerSignature({
          role,
        } as ConventionMagicLinkPayload),
        new ForbiddenError(
          "Only Beneficiary, his legal representative or the establishment representative are allowed to sign convention",
        ),
      );
    },
  );

  const allowedRole = allRoles[0];

  it("Convention cannot be signed if it is not found in DB", async () => {
    await expectPromiseToFailWithError(
      triggerSignature({
        role: allowedRole,
      } as ConventionMagicLinkPayload),
      new NotFoundError(),
    );
  });

  const [allowedInitialStatuses, forbiddenInitialStatuses] =
    splitCasesBetweenPassingAndFailing<ConventionStatus>(
      allConventionStatuses,
      ["READY_TO_SIGN", "PARTIALLY_SIGNED"],
    );

  it.each(forbiddenInitialStatuses.map((initialStatus) => ({ initialStatus })))(
    "$initialStatus initial status is not allowed",
    async ({ initialStatus }) => {
      const conventionInDb = prepareConventionWithStatus(initialStatus);
      conventionRepository.setConventions({
        [conventionInDb.id]: conventionInDb,
      });

      await expectPromiseToFailWithError(
        triggerSignature({
          role: allowedRole,
          applicationId: conventionInDb.id,
        } as ConventionMagicLinkPayload),
        new BadRequestError(
          `Cannot go from status '${initialStatus}' to 'PARTIALLY_SIGNED'`,
        ),
      );
    },
  );

  it.each(allowedToSignRoles.map((role) => ({ role })))(
    "updates the convention with new signature for $role",
    async ({ role }) => {
      const conventionInDb = prepareConventionWithStatus("READY_TO_SIGN");
      conventionRepository.setConventions({
        [conventionInDb.id]: conventionInDb,
      });
      const signedAt = new Date("2022-01-01");
      clock.setNextDate(signedAt);

      await triggerSignature({
        role,
        applicationId: conventionInDb.id,
      } as ConventionMagicLinkPayload);

      expectConventionInDbToEqual({
        ...conventionInDb,
        status: "PARTIALLY_SIGNED",
        signatories: makeSignatories(conventionInDb, {
          establishmentRepresentativeSignedAt:
            role === "establishment-representative" || role === "establishment"
              ? signedAt.toISOString()
              : undefined,
          beneficiarySignedAt:
            role === "beneficiary" ? signedAt.toISOString() : undefined,
          beneficiaryRepresentativeSignedAt:
            role === "beneficiary-representative" ||
            role === "legal-representative"
              ? signedAt.toISOString()
              : undefined,
        }),
      });
    },
  );

  it("goes from status READY_TO_SIGN to PARTIALLY_SIGNED, and saves corresponding event", async () => {
    expectAllowedInitialStatus("READY_TO_SIGN");
    const initialConvention = prepareConventionWithStatus("READY_TO_SIGN");
    conventionRepository.setConventions({
      [initialConvention.id]: initialConvention,
    });
    const signedAt = new Date("2022-01-01");
    clock.setNextDate(signedAt);

    await triggerSignature({
      role: "establishment",
      applicationId: initialConvention.id,
    } as ConventionMagicLinkPayload);

    const expectedConvention: ConventionDto = {
      ...initialConvention,
      status: "PARTIALLY_SIGNED",
      signatories: makeSignatories(initialConvention, {
        establishmentRepresentativeSignedAt: signedAt.toISOString(),
      }),
    };
    expectConventionInDbToEqual(expectedConvention);
    expectEventsInOutbox([
      {
        topic: "ImmersionApplicationPartiallySigned",
        payload: expectedConvention,
      },
    ]);
  });

  it("goes from status PARTIALLY_SIGNED to PARTIALLY_SIGNED, and saves corresponding event", async () => {
    expectAllowedInitialStatus("PARTIALLY_SIGNED");
    const beneficiarySignedAt = new Date("2022-01-02");
    const initialConvention = new ConventionDtoBuilder()
      .withId("my-convention-id")
      .withStatus("PARTIALLY_SIGNED")
      .withBeneficiaryRepresentative(beneficiaryRepresentative)
      .notSigned()
      .signedByBeneficiary(beneficiarySignedAt.toISOString())
      .build();

    conventionRepository.setConventions({
      [initialConvention.id]: initialConvention,
    });

    const establishmentRepresentativeSignedAt = new Date("2022-01-01");
    clock.setNextDate(establishmentRepresentativeSignedAt);

    await triggerSignature({
      role: "establishment",
      applicationId: initialConvention.id,
    } as ConventionMagicLinkPayload);

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
    expectConventionInDbToEqual(expectedConvention);
    expectEventsInOutbox([
      {
        topic: "ImmersionApplicationPartiallySigned",
        payload: expectedConvention,
      },
    ]);
  });

  it("With 2 signatories, goes from status PARTIALLY_SIGNED to IN_REVIEW, and saves corresponding event", async () => {
    expectAllowedInitialStatus("PARTIALLY_SIGNED");
    const beneficiarySignedAt = new Date("2022-01-02");
    const initialConvention = new ConventionDtoBuilder()
      .withId("my-convention-id")
      .withStatus("PARTIALLY_SIGNED")
      .notSigned()
      .signedByBeneficiary(beneficiarySignedAt.toISOString())
      .build();

    conventionRepository.setConventions({
      [initialConvention.id]: initialConvention,
    });

    const establishmentRepresentativeSignedAt = new Date("2022-01-01");
    clock.setNextDate(establishmentRepresentativeSignedAt);

    await triggerSignature({
      role: "establishment",
      applicationId: initialConvention.id,
    } as ConventionMagicLinkPayload);

    const expectedConvention: ConventionDto = {
      ...initialConvention,
      status: "IN_REVIEW",
      signatories: makeSignatories(initialConvention, {
        beneficiarySignedAt: beneficiarySignedAt.toISOString(),
        establishmentRepresentativeSignedAt:
          establishmentRepresentativeSignedAt.toISOString(),
      }),
    };
    expectConventionInDbToEqual(expectedConvention);
    expectEventsInOutbox([
      {
        topic: "ImmersionApplicationFullySigned",
        payload: expectedConvention,
      },
    ]);
  });

  const triggerSignature = (jwtPayload: ConventionMagicLinkPayload) =>
    signConvention.execute(undefined, jwtPayload);

  const prepareConventionWithStatus = (status: ConventionStatus) => {
    const conventionId = "my-convention-id";
    return new ConventionDtoBuilder()
      .withId(conventionId)
      .withStatus(status)
      .withBeneficiaryRepresentative(beneficiaryRepresentative)
      .withEstablishmentRepresentative(establishmentRepresentative)
      .notSigned()
      .build();
  };

  const expectAllowedInitialStatus = (status: ConventionStatus) =>
    expect(allowedInitialStatuses.includes(status)).toBeTruthy();

  const expectConventionInDbToEqual = (convention: ConventionDto) => {
    const signedConvention = conventionRepository.conventions[0];
    expectToEqual(signedConvention, convention);
  };

  const expectEventsInOutbox = (events: Partial<DomainEvent>[]) => {
    expect(outboxRepository.events).toMatchObject(events);
  };
});

const makeSignatories = (
  convention: ConventionDto,
  {
    establishmentRepresentativeSignedAt,
    beneficiarySignedAt,
    beneficiaryRepresentativeSignedAt,
  }: {
    establishmentRepresentativeSignedAt?: string;
    beneficiarySignedAt?: string;
    beneficiaryRepresentativeSignedAt?: string;
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
  establishmentRepresentative: {
    ...convention.signatories.establishmentRepresentative,
    signedAt: establishmentRepresentativeSignedAt,
  },
});
