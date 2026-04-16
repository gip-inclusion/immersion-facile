import {
  AgencyDtoBuilder,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  type ConventionStatus,
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

  const baseRequest = {
    conventionId,
    updatedBeneficiaryBirthDate: newBirthdate,
    dateStart: convention.dateStart,
    internshipKind: convention.internshipKind,
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

    it.each([
      "READY_TO_SIGN",
      "PARTIALLY_SIGNED",
      "IN_REVIEW",
      "ACCEPTED_BY_COUNSELLOR",
    ] satisfies ConventionStatus[])("throws when convention status is not allowed (%s)", async (status) => {
      const conventionWithStatus = new ConventionDtoBuilder(convention)
        .withStatus(status)
        .build();
      uow.conventionRepository.setConventions([conventionWithStatus]);
      uow.userRepository.users = [backOfficeAdmin];

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            ...baseRequest,
            dateStart: conventionWithStatus.dateStart,
            internshipKind: conventionWithStatus.internshipKind,
          },
          backOfficeAdmin,
        ),
        errors.convention.editConventionWithFinalStatusNotAllowedForStatus({
          status,
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
            dateStart: conventionWithoutRepresentative.dateStart,
            internshipKind: conventionWithoutRepresentative.internshipKind,
          },
          backOfficeAdmin,
        ),
        errors.convention.invalidConventionAfterFinalStatusEdit({
          message:
            "Les bénéficiaires mineurs doivent renseigner un représentant légal. Le bénéficiaire aurait 17 ans au démarrage de la convention.",
        }),
      );
    });

    it("throws when beneficiary would be under 16 years old", async () => {
      const beneficiaryUnder16YearsOldBirthdate = "2015-01-01";
      uow.conventionRepository.setConventions([convention]);
      uow.userRepository.users = [backOfficeAdmin];

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            ...baseRequest,
            updatedBeneficiaryBirthDate: beneficiaryUnder16YearsOldBirthdate,
          },
          backOfficeAdmin,
        ),
        errors.inputs.badSchema({
          useCaseName: "EditConventionWithFinalStatus",
          flattenErrors: [
            "updatedBeneficiaryBirthDate : L'âge du bénéficiaire doit être au minimum de 16ans",
          ],
        }),
      );
    });
  });

  describe("Right path", () => {
    it("updates beneficiary birthdate and names and saves ConventionWithFinalStatusEdited event", async () => {
      uow.conventionRepository.setConventions([convention]);
      uow.userRepository.users = [backOfficeAdmin];

      await usecase.execute(baseRequest, backOfficeAdmin);

      const updatedConvention = uow.conventionRepository.conventions[0];
      expectToEqual(updatedConvention, {
        ...convention,
        signatories: {
          ...convention.signatories,
          beneficiary: {
            ...convention.signatories.beneficiary,
            birthdate: newBirthdate,
            firstName: newFirstName,
            lastName: newLastName,
          },
        },
      });
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

    it("updates only beneficiary birthdate when only birthdate is provided", async () => {
      uow.conventionRepository.setConventions([convention]);
      uow.userRepository.users = [backOfficeAdmin];

      await usecase.execute(
        {
          conventionId,
          dateStart: convention.dateStart,
          internshipKind: convention.internshipKind,
          updatedBeneficiaryBirthDate: newBirthdate,
        },
        backOfficeAdmin,
      );

      const updatedConvention = uow.conventionRepository.conventions[0];
      expectToEqual(updatedConvention, {
        ...convention,
        signatories: {
          ...convention.signatories,
          beneficiary: {
            ...convention.signatories.beneficiary,
            birthdate: newBirthdate,
          },
        },
      });
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
          dateStart: convention.dateStart,
          internshipKind: convention.internshipKind,
          firstname: newFirstName,
        },
        backOfficeAdmin,
      );

      const updatedConvention = uow.conventionRepository.conventions[0];
      expectToEqual(updatedConvention, {
        ...convention,
        signatories: {
          ...convention.signatories,
          beneficiary: {
            ...convention.signatories.beneficiary,
            firstName: newFirstName,
          },
        },
      });
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
