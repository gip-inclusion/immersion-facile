import {
  AgencyDtoBuilder,
  allRoles,
  allSignatoryRoles,
  type BeneficiaryRepresentative,
  ConnectedUserBuilder,
  type ConventionDto,
  ConventionDtoBuilder,
  type ConventionId,
  type ConventionRole,
  type ConventionStatus,
  conventionStatuses,
  type EstablishmentRepresentative,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  ForbiddenError,
  type Signatories,
  splitCasesBetweenPassingAndFailing,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import type { DomainEvent } from "../../core/events/events";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
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
        errors.convention.notFound({ conventionId }),
      );
    });

    describe("forbidden roles with convention jwt", () => {
      it.each(forbiddenToSignRoles.map((role) => ({ role })))(
        "$role is not allowed to sign",
        async ({ role }) => {
          const { convention, agency } =
            prepareAgencyAndConventionWithStatus("READY_TO_SIGN");
          uow.conventionRepository.setConventions([convention]);
          uow.agencyRepository.agencies = [toAgencyWithRights(agency)];

          await expectPromiseToFailWithError(
            signConvention.execute(
              { conventionId },
              {
                role: role as ConventionRole,
                applicationId: conventionId,
                emailHash: "toto",
              },
            ),
            errors.convention.roleNotAllowedToSign({ role }),
          );
        },
      );
    });

    describe("with convention connected user jwt", () => {
      it("wh IC user is not establishment rep", async () => {
        const { convention, agency } =
          prepareAgencyAndConventionWithStatus("READY_TO_SIGN");
        uow.conventionRepository.setConventions([convention]);
        const user = new ConnectedUserBuilder()
          .withId("my-user-id")
          .withEmail("other@mail.com")
          .buildUser();
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [user.id]: { roles: ["validator"], isNotifiedByEmail: false },
          }),
        ];
        uow.userRepository.users = [user];
        const signedAt = new Date("2022-01-01");
        timeGateway.setNextDate(signedAt);

        await expectPromiseToFailWithError(
          signConvention.execute(
            { conventionId },
            {
              userId: user.id,
            },
          ),
          new ForbiddenError(
            `User '${user.id}' is not the establishment representative for convention '${conventionId}'`,
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
          const { convention, agency } =
            prepareAgencyAndConventionWithStatus(initialStatus);
          uow.conventionRepository.setConventions([convention]);
          uow.agencyRepository.agencies = [toAgencyWithRights(agency)];

          await expectPromiseToFailWithError(
            signConvention.execute(
              { conventionId },
              {
                role: allowedRole,
                applicationId: conventionId,
                emailHash: "toto",
              },
            ),
            errors.convention.badStatusTransition({
              currentStatus: initialStatus,
              targetStatus: "PARTIALLY_SIGNED",
            }),
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
          const { convention, agency } =
            prepareAgencyAndConventionWithStatus("READY_TO_SIGN");
          uow.conventionRepository.setConventions([convention]);
          uow.agencyRepository.agencies = [toAgencyWithRights(agency)];
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
              ...convention,
              status: "PARTIALLY_SIGNED",
              signatories: makeSignatories(convention, {
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

    describe("with connected user jwt", () => {
      it("updates the convention with new signature for IC user when user is establisment representative", async () => {
        const { convention, agency } =
          prepareAgencyAndConventionWithStatus("READY_TO_SIGN");
        uow.conventionRepository.setConventions([convention]);
        const user = new ConnectedUserBuilder()
          .withEmail(convention.signatories.establishmentRepresentative.email)
          .withProConnectInfos({
            externalId: "billy-external-id",
            siret: "11111222224444",
          })
          .buildUser();
        uow.agencyRepository.agencies = [toAgencyWithRights(agency)];
        uow.userRepository.users = [user];
        const signedAt = new Date("2022-01-01");
        timeGateway.setNextDate(signedAt);

        await signConvention.execute(
          { conventionId },
          {
            userId: user.id,
          },
        );

        expectToEqual(uow.conventionRepository.conventions, [
          {
            ...convention,
            status: "PARTIALLY_SIGNED",
            signatories: makeSignatories(convention, {
              establishmentRepresentativeSignedAt: signedAt.toISOString(),
            }),
          },
        ]);
      });
    });

    describe("convention status transitions", () => {
      it("goes from status READY_TO_SIGN to PARTIALLY_SIGNED, and saves corresponding event", async () => {
        expectAllowedInitialStatus("READY_TO_SIGN");
        const { convention: initialConvention, agency } =
          prepareAgencyAndConventionWithStatus("READY_TO_SIGN");
        uow.conventionRepository.setConventions([initialConvention]);
        uow.agencyRepository.agencies = [toAgencyWithRights(agency)];
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
            payload: {
              convention: expectedConvention,
              triggeredBy: {
                kind: "convention-magic-link",
                role: "establishment-representative",
              },
            },
          },
        ]);
      });

      it("goes from status PARTIALLY_SIGNED to PARTIALLY_SIGNED, and saves corresponding event", async () => {
        expectAllowedInitialStatus("PARTIALLY_SIGNED");
        const beneficiarySignedAt = new Date("2022-01-02");
        const agency = new AgencyDtoBuilder().build();
        const initialConvention = new ConventionDtoBuilder()
          .withId(conventionId)
          .withAgencyId(agency.id)
          .withStatus("PARTIALLY_SIGNED")
          .withBeneficiaryRepresentative(beneficiaryRepresentative)
          .notSigned()
          .signedByBeneficiary(beneficiarySignedAt.toISOString())
          .build();

        uow.conventionRepository.setConventions([initialConvention]);
        uow.agencyRepository.agencies = [toAgencyWithRights(agency)];

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
            payload: {
              convention: expectedConvention,
              triggeredBy: {
                kind: "convention-magic-link",
                role: "establishment-representative",
              },
            },
          },
        ]);
      });

      it("with 2 signatories, goes from status PARTIALLY_SIGNED to IN_REVIEW, and saves corresponding event", async () => {
        expectAllowedInitialStatus("PARTIALLY_SIGNED");
        const beneficiarySignedAt = new Date("2022-01-02");

        const agency = new AgencyDtoBuilder().build();
        const initialConvention = new ConventionDtoBuilder()
          .withId(conventionId)
          .withAgencyId(agency.id)
          .withStatus("PARTIALLY_SIGNED")
          .notSigned()
          .signedByBeneficiary(beneficiarySignedAt.toISOString())
          .build();

        uow.conventionRepository.setConventions([initialConvention]);
        uow.agencyRepository.agencies = [toAgencyWithRights(agency)];

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
            payload: {
              convention: expectedConvention,
              triggeredBy: {
                kind: "convention-magic-link",
                role: "establishment-representative",
              },
            },
          },
        ]);
      });
    });
  });

  const conventionId: ConventionId = "abd5c20e-6dd2-45af-affe-927358005251";
  const prepareAgencyAndConventionWithStatus = (status: ConventionStatus) => {
    const agency = new AgencyDtoBuilder().build();

    return {
      agency,
      convention: new ConventionDtoBuilder()
        .withId(conventionId)
        .withAgencyId(agency.id)
        .withStatus(status)
        .withBeneficiaryRepresentative(beneficiaryRepresentative)
        .withEstablishmentRepresentative(establishmentRepresentative)
        .notSigned()
        .build(),
    };
  };

  const expectAllowedInitialStatus = (status: ConventionStatus) =>
    expect(
      allowedInitialStatuses.includes(
        status as "READY_TO_SIGN" | "PARTIALLY_SIGNED",
      ),
    ).toBeTruthy();

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
