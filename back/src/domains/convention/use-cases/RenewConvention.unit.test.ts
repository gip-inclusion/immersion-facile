import { addDays } from "date-fns";
import {
  AgencyDtoBuilder,
  BadRequestError,
  ConventionDomainPayload,
  ConventionDtoBuilder,
  ConventionId,
  ConventionRelatedJwtPayload,
  ForbiddenError,
  InclusionConnectedUserBuilder,
  NotFoundError,
  RenewConventionParams,
  Role,
  ScheduleDtoBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { InMemorySiretGateway } from "../../core/sirene/adapters/InMemorySiretGateway";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { AddConvention } from "./AddConvention";
import { RenewConvention } from "./RenewConvention";

describe("RenewConvention", () => {
  let renewConvention: RenewConvention;
  let uow: InMemoryUnitOfWork;
  let uuidGenerator: TestUuidGenerator;

  const validator = new InclusionConnectedUserBuilder()
    .withId("validator")
    .withEmail("validator@mail.com")
    .buildUser();
  const agencyAdmin = new InclusionConnectedUserBuilder()
    .withId("agency-admin")
    .withEmail("agency-admin@mail.com")
    .buildUser();
  const backofficeAdmin = new InclusionConnectedUserBuilder()
    .withId("admin")
    .withIsAdmin(true)
    .buildUser();

  const agency = new AgencyDtoBuilder().build();

  const existingValidatedConvention = new ConventionDtoBuilder()
    .withStatus("ACCEPTED_BY_VALIDATOR")
    .withAgencyId(agency.id)
    .build();

  const renewedConventionStartDate = addDays(
    new Date(existingValidatedConvention.dateEnd),
    1,
  );
  const renewConventionEndDate = addDays(renewedConventionStartDate, 5);

  const renewConventionParams: RenewConventionParams = {
    id: "11111111-1111-4111-1111-111111111111",
    dateStart: renewedConventionStartDate.toISOString(),
    dateEnd: renewConventionEndDate.toISOString(),
    schedule: new ScheduleDtoBuilder()
      .withReasonableScheduleInInterval({
        start: renewedConventionStartDate,
        end: renewConventionEndDate,
      })
      .build(),
    renewed: {
      from: existingValidatedConvention.id,
      justification: "Il faut bien...",
    },
  };

  beforeEach(() => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    uuidGenerator = new TestUuidGenerator();
    renewConvention = new RenewConvention(
      uowPerformer,
      new AddConvention(
        uowPerformer,
        makeCreateNewEvent({
          timeGateway: new CustomTimeGateway(),
          uuidGenerator,
        }),
        new InMemorySiretGateway(),
      ),
    );
    uow.conventionRepository.setConventions([existingValidatedConvention]);
    uow.userRepository.users = [backofficeAdmin, validator, agencyAdmin];
    uow.agencyRepository.agencies = [
      toAgencyWithRights(agency, {
        [validator.id]: { isNotifiedByEmail: false, roles: ["validator"] },
        [agencyAdmin.id]: { isNotifiedByEmail: false, roles: ["agency-admin"] },
      }),
    ];
  });

  const createJwtPayload = ({
    conventionId,
    role,
  }: {
    conventionId: ConventionId;
    role: Role;
  }): ConventionDomainPayload => ({
    applicationId: conventionId,
    role,
    emailHash: "my-hash",
  });

  describe("Happy paths", () => {
    it.each([
      {
        payloadKind: "convention",
        payload: createJwtPayload({
          role: "validator",
          conventionId: existingValidatedConvention.id,
        }),
      },
      {
        payloadKind: "inclusionConnect admin",
        payload: { userId: backofficeAdmin.id },
      },
      {
        payloadKind: "inclusionConnect",
        payload: {
          userId: validator.id,
        },
      },
    ] satisfies {
      payloadKind: string;
      payload: ConventionRelatedJwtPayload;
    }[])(
      "renews the convention with $payloadKind jwt payload",
      async ({ payload }) => {
        const result = await renewConvention.execute(
          renewConventionParams,
          payload,
        );

        expect(result).toBeUndefined();

        expectToEqual(uow.conventionRepository.conventions, [
          existingValidatedConvention,
          {
            ...existingValidatedConvention,
            ...renewConventionParams,
            signatories: {
              beneficiary: {
                ...existingValidatedConvention.signatories.beneficiary,
                signedAt: undefined,
              },
              establishmentRepresentative: {
                ...existingValidatedConvention.signatories
                  .establishmentRepresentative,
                signedAt: undefined,
              },
            },
            status: "READY_TO_SIGN",
          },
        ]);
      },
    );
  });

  describe("Wrong paths", () => {
    it("throws an error when no JWT payload", async () => {
      await expectPromiseToFailWithError(
        renewConvention.execute(renewConventionParams),
        errors.user.unauthorized(),
      );
    });

    it("throws an error when convention id in params does not match to convention id in JWT payload", async () => {
      await expectPromiseToFailWithError(
        renewConvention.execute(
          renewConventionParams,
          createJwtPayload({
            role: "validator",
            conventionId: "another-convention-id",
          }),
        ),
        new ForbiddenError(
          "This token is not allowed to renew this convention",
        ),
      );
    });

    it("throws an error when convention not found", async () => {
      uow.conventionRepository.setConventions([]);

      await expectPromiseToFailWithError(
        renewConvention.execute(
          renewConventionParams,
          createJwtPayload({
            role: "validator",
            conventionId: existingValidatedConvention.id,
          }),
        ),
        errors.convention.notFound({
          conventionId: existingValidatedConvention.id,
        }),
      );
    });

    it("throws an error when convention is not ACCEPTED_BY_VALIDATOR", async () => {
      const existingDraftConvention = new ConventionDtoBuilder().build();

      uow.conventionRepository.setConventions([existingDraftConvention]);

      await expectPromiseToFailWithError(
        renewConvention.execute(
          renewConventionParams,
          createJwtPayload({
            role: "validator",
            conventionId: existingDraftConvention.id,
          }),
        ),
        new BadRequestError(
          `This convention cannot be renewed, as it has status : '${existingDraftConvention.status}'`,
        ),
      );
    });

    it("throws an error when jwt role has not enough privileges", async () => {
      await expectPromiseToFailWithError(
        renewConvention.execute(
          renewConventionParams,
          createJwtPayload({
            role: "beneficiary",
            conventionId: existingValidatedConvention.id,
          }),
        ),
        new ForbiddenError(
          `The role 'beneficiary' is not allowed to renew convention`,
        ),
      );
    });

    it("throws an error when missing inclusion connect user", async () => {
      uow.userRepository.users = [];

      await expectPromiseToFailWithError(
        renewConvention.execute(renewConventionParams, {
          userId: validator.id,
        }),
        new NotFoundError(
          `Inclusion connected user '${validator.id}' not found.`,
        ),
      );
    });

    it("throws an error when inclusion connect user has no rights on agency", async () => {
      uow.agencyRepository.agencies = [toAgencyWithRights(agency)];

      await expectPromiseToFailWithError(
        renewConvention.execute(renewConventionParams, {
          userId: validator.id,
        }),
        new ForbiddenError(
          `You don't have sufficient rights on agency '${existingValidatedConvention.agencyId}'.`,
        ),
      );
    });

    it("throws an error when inclusion connect user has bad rights on agency", async () => {
      await expectPromiseToFailWithError(
        renewConvention.execute(renewConventionParams, {
          userId: agencyAdmin.id,
        }),
        new ForbiddenError(
          "The role 'agency-admin' is not allowed to renew convention",
        ),
      );
    });
  });
});
