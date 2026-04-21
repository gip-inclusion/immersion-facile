import {
  AgencyDtoBuilder,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  conventionStatusesAllowedForModification,
  type EditConventionWithFinalStatusRequestDto,
  errors,
  expectArraysToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";

import {
  type EditConventionWithFinalStatus,
  makeEditConventionWithFinalStatus,
} from "./EditConventionWithFinalStatus";

describe("EditConventionWithFinalStatus", () => {
  const conventionId = "add5c20e-6dd2-45af-affe-927358005251";
  const agency = new AgencyDtoBuilder().build();
  const newBirthdate = "1995-03-15";
  const oldBeneficiaryBirthdate = "2002-10-05";
  const newFirstName = "Jean";
  const newLastName = "Martin";

  const convention = new ConventionDtoBuilder()
    .withId(conventionId)
    .withStatus("ACCEPTED_BY_VALIDATOR")
    .withAgencyId(agency.id)
    .withBeneficiaryBirthdate(oldBeneficiaryBirthdate)
    .build();

  const baseRequest: EditConventionWithFinalStatusRequestDto = {
    conventionId,
    updatedBeneficiaryBirthDate: newBirthdate,
    firstname: newFirstName,
    lastname: newLastName,
  };

  const backOfficeAdmin = new ConnectedUserBuilder()
    .withId("bcc5c20e-6dd2-45cf-affe-927358005262")
    .withIsAdmin(true)
    .build();

  const nonAdminUser = new ConnectedUserBuilder()
    .withId("bcc5c20e-6dd2-45cf-affe-927358005263")
    .withIsAdmin(false)
    .build();

  let uow: InMemoryUnitOfWork;
  let usecase: EditConventionWithFinalStatus;

  beforeEach(() => {
    uow = createInMemoryUow();
    usecase = makeEditConventionWithFinalStatus({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        createNewEvent: makeCreateNewEvent({
          timeGateway: new CustomTimeGateway(),
          uuidGenerator: new TestUuidGenerator(),
        }),
      },
    });

    uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
  });

  describe("Wrong paths", () => {
    it("throws when convention is not found", async () => {
      const nonExistentConventionId = "00000000-0000-4000-8000-000000000001";
      uow.userRepository.users = [backOfficeAdmin];

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            ...baseRequest,
            conventionId: nonExistentConventionId,
          },
          backOfficeAdmin,
        ),
        errors.convention.notFound({
          conventionId: nonExistentConventionId,
        }),
      );
    });

    it.each(
      conventionStatusesAllowedForModification,
    )("throws when convention status is not allowed (%s)", async (status) => {
      const conventionWithStatus = new ConventionDtoBuilder(convention)
        .withStatus(status)
        .build();
      uow.conventionRepository.setConventions([conventionWithStatus]);
      uow.userRepository.users = [backOfficeAdmin];

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            ...baseRequest,
            conventionId: conventionWithStatus.id,
          },
          backOfficeAdmin,
        ),
        errors.convention.editConventionWithFinalStatusNotAllowedForStatus({
          status,
          conventionId: conventionWithStatus.id,
        }),
      );
    });

    it("throws when user is not back-office admin", async () => {
      uow.conventionRepository.setConventions([convention]);
      uow.userRepository.users = [nonAdminUser];

      await expectPromiseToFailWithError(
        usecase.execute(baseRequest, nonAdminUser),
        errors.user.forbidden({ userId: nonAdminUser.id }),
      );
    });

    it("throws when minor above 16 years old but without representative", async () => {
      const conventionWithoutRepresentative = new ConventionDtoBuilder(
        convention,
      )
        .withBeneficiaryRepresentative(undefined)
        .build();
      const minorAbove16YearsOldBirthdate = "2007-10-01";
      uow.conventionRepository.setConventions([
        conventionWithoutRepresentative,
      ]);
      uow.userRepository.users = [backOfficeAdmin];

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            ...baseRequest,
            updatedBeneficiaryBirthDate: minorAbove16YearsOldBirthdate,
          },
          backOfficeAdmin,
        ),
        errors.convention.invalidConventionAfterFinalStatusEdit({
          message:
            "Les bénéficiaires mineurs doivent renseigner un représentant légal. Le bénéficiaire aurait 17 ans au démarrage de la convention.",
          conventionId,
        }),
      );
    });

    it("throws when beneficiary would be under minimum age for immersion", async () => {
      const conventionWithRepresentative = new ConventionDtoBuilder(convention)
        .withBeneficiaryRepresentative({
          role: "beneficiary-representative",
          email: "rep.parent@email.fr",
          phone: "+33601010102",
          firstName: "Rep",
          lastName: "Legal",
        })
        .build();
      uow.conventionRepository.setConventions([conventionWithRepresentative]);
      uow.userRepository.users = [backOfficeAdmin];

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId,
            updatedBeneficiaryBirthDate: "2009-06-01",
          },
          backOfficeAdmin,
        ),
        errors.convention.invalidConventionAfterFinalStatusEdit({
          message:
            "L'âge du bénéficiaire doit être au minimum de 16ans; La confirmation de votre accord est obligatoire.",
          conventionId,
        }),
      );
    });
  });

  describe("Right path", () => {
    it("updates beneficiary birthdate and names and saves ConventionWithFinalStatusEdited event", async () => {
      uow.conventionRepository.setConventions([convention]);
      uow.userRepository.users = [backOfficeAdmin];

      await usecase.execute(baseRequest, backOfficeAdmin);

      const expectedConvention = new ConventionDtoBuilder(convention)
        .withBeneficiaryBirthdate(newBirthdate)
        .withBeneficiaryFirstName(newFirstName)
        .withBeneficiaryLastName(newLastName)
        .build();
      expectToEqual(uow.conventionRepository.conventions, [expectedConvention]);
      expectArraysToMatch(uow.outboxRepository.events, [
        {
          topic: "ConventionWithFinalStatusEdited",
          payload: {
            convention: expectedConvention,
            triggeredBy: {
              kind: "connected-user",
              userId: backOfficeAdmin.id,
            },
          },
        },
      ]);
    });

    it("updates only beneficiary birthdate when only birthdate is provided", async () => {
      uow.conventionRepository.setConventions([convention]);
      uow.userRepository.users = [backOfficeAdmin];

      await usecase.execute(
        {
          conventionId,
          updatedBeneficiaryBirthDate: newBirthdate,
        },
        backOfficeAdmin,
      );

      const updatedConvention = new ConventionDtoBuilder(convention)
        .withBeneficiaryBirthdate(newBirthdate)
        .build();
      expectToEqual(uow.conventionRepository.conventions, [updatedConvention]);
      expectArraysToMatch(uow.outboxRepository.events, [
        {
          topic: "ConventionWithFinalStatusEdited",
          payload: {
            convention: updatedConvention,
            triggeredBy: {
              kind: "connected-user",
              userId: backOfficeAdmin.id,
            },
          },
        },
      ]);
    });

    it("updates only beneficiary first name when only first name is provided", async () => {
      uow.conventionRepository.setConventions([convention]);
      uow.userRepository.users = [backOfficeAdmin];

      await usecase.execute(
        {
          conventionId,
          firstname: newFirstName,
        },
        backOfficeAdmin,
      );

      const updatedConvention = new ConventionDtoBuilder(convention)
        .withBeneficiaryFirstName(newFirstName)
        .build();
      expectToEqual(uow.conventionRepository.conventions, [updatedConvention]);
      expectArraysToMatch(uow.outboxRepository.events, [
        {
          topic: "ConventionWithFinalStatusEdited",
          payload: {
            convention: updatedConvention,
            triggeredBy: {
              kind: "connected-user",
              userId: backOfficeAdmin.id,
            },
          },
        },
      ]);
    });
  });
});
