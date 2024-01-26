import { addDays } from "date-fns";
import {
  AgencyDtoBuilder,
  ConventionDomainPayload,
  ConventionDtoBuilder,
  ConventionId,
  ConventionRelatedJwtPayload,
  expectPromiseToFailWithError,
  expectToEqual,
  InclusionConnectDomainJwtPayload,
  InclusionConnectedUser,
  RenewConventionParams,
  Role,
  ScheduleDtoBuilder,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InMemorySiretGateway } from "../../../adapters/secondary/siret/InMemorySiretGateway";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { AddConvention } from "./AddConvention";
import { RenewConvention } from "./RenewConvention";

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

describe("RenewConvention", () => {
  let renewConvention: RenewConvention;
  let uow: InMemoryUnitOfWork;
  let uuidGenerator: TestUuidGenerator;

  const existingDraftConvention = new ConventionDtoBuilder().build();
  const renewedConventionStartDate = addDays(
    new Date(existingDraftConvention.dateEnd),
    1,
  );
  const renewConventionEndDate = addDays(renewedConventionStartDate, 5);
  const renewedConventionId: ConventionId =
    "11111111-1111-4111-1111-111111111111";
  const renewConventionParams: RenewConventionParams = {
    id: renewedConventionId,
    dateStart: renewedConventionStartDate.toISOString(),
    dateEnd: renewConventionEndDate.toISOString(),
    schedule: new ScheduleDtoBuilder()
      .withReasonableScheduleInInterval({
        start: renewedConventionStartDate,
        end: renewConventionEndDate,
      })
      .build(),
    renewed: {
      from: existingDraftConvention.id,
      justification: "Il faut bien...",
    },
  };

  const agency = new AgencyDtoBuilder().build();
  const existingValidatedConvention = new ConventionDtoBuilder()
    .withStatus("ACCEPTED_BY_VALIDATOR")
    .withAgencyId(agency.id)
    .build();
  const inclusionConnectedUser: InclusionConnectedUser = {
    id: "my-user-id",
    email: "my-user@email.com",
    firstName: "John",
    lastName: "Doe",
    agencyRights: [{ role: "validator", agency }],
    establishmentDashboards: {},
  };
  const inclusionConnectPayload: InclusionConnectDomainJwtPayload = {
    userId: inclusionConnectedUser.id,
  };

  beforeEach(() => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);

    const timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({
      timeGateway,
      uuidGenerator,
    });
    const siretGateway = new InMemorySiretGateway();
    const addConvention = new AddConvention(
      uowPerformer,
      createNewEvent,
      siretGateway,
    );
    renewConvention = new RenewConvention(uowPerformer, addConvention);
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
        payloadKind: "backOffice",
        payload: {
          role: "backOffice",
          sub: "my-sub",
        },
      },
      {
        payloadKind: "inclusionConnect",
        payload: inclusionConnectPayload,
      },
    ] satisfies { payloadKind: string; payload: ConventionRelatedJwtPayload }[])(
      "renews the convention with $payloadKind jwt payload",
      async ({ payload }) => {
        uow.conventionRepository.setConventions([existingValidatedConvention]);

        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
          inclusionConnectedUser,
        ]);

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
        new UnauthorizedError(),
      );
    });

    it("throws an error when convention id in params does not match to convention id in JWT payload", async () => {
      uow.conventionRepository.setConventions([existingDraftConvention]);

      await expectPromiseToFailWithError(
        renewConvention.execute(
          renewConventionParams,
          createJwtPayload({
            role: "validator",
            conventionId: "another-convention-id",
          }),
        ),
        new ForbiddenError(
          `This token is not allowed to renew this convention`,
        ),
      );
    });

    it("throws an error when convention not found", async () => {
      const notSavedConvention = existingDraftConvention;
      await expectPromiseToFailWithError(
        renewConvention.execute(
          renewConventionParams,
          createJwtPayload({
            role: "validator",
            conventionId: notSavedConvention.id,
          }),
        ),
        new NotFoundError(
          `Convention with id '${notSavedConvention.id}' not found`,
        ),
      );
    });

    it("throws an error when convention is not ACCEPTED_BY_VALIDATOR", async () => {
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
      uow.conventionRepository.setConventions([existingDraftConvention]);
      await expectPromiseToFailWithError(
        renewConvention.execute(
          renewConventionParams,
          createJwtPayload({
            role: "beneficiary",
            conventionId: existingDraftConvention.id,
          }),
        ),
        new ForbiddenError(
          `The role 'beneficiary' is not allowed to renew convention`,
        ),
      );
    });

    it("throws an error when missing inclusion connect user", async () => {
      uow.conventionRepository.setConventions([existingValidatedConvention]);
      await expectPromiseToFailWithError(
        renewConvention.execute(renewConventionParams, inclusionConnectPayload),
        new NotFoundError(
          `Inclusion connected user '${inclusionConnectPayload.userId}' not found.`,
        ),
      );
    });

    it("throws an error when inclusion connect user has no rights on agency", async () => {
      uow.conventionRepository.setConventions([existingValidatedConvention]);
      uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
        { ...inclusionConnectedUser, agencyRights: [] },
      ]);
      await expectPromiseToFailWithError(
        renewConvention.execute(renewConventionParams, inclusionConnectPayload),
        new ForbiddenError(
          `You don't have suffisiant rights on agency '${existingValidatedConvention.agencyId}'.`,
        ),
      );
    });

    it("throws an error when inclusion connect user has bad rights on agency", async () => {
      uow.conventionRepository.setConventions([existingValidatedConvention]);
      uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
        {
          ...inclusionConnectedUser,
          agencyRights: [{ agency, role: "agencyOwner" }],
        },
      ]);
      await expectPromiseToFailWithError(
        renewConvention.execute(renewConventionParams, inclusionConnectPayload),
        new ForbiddenError(
          `You don't have suffisiant rights on agency '${existingValidatedConvention.agencyId}'.`,
        ),
      );
    });
  });
});
