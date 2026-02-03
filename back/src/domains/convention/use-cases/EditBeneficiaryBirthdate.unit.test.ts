import {
  AgencyDtoBuilder,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
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
  type EditBeneficiaryBirthdate,
  makeEditBeneficiaryBirthdate,
} from "./EditBeneficiaryBirthdate";

describe("EditBeneficiaryBirthdate", () => {
  const conventionId = "add5c20e-6dd2-45af-affe-927358005251";
  const agency = new AgencyDtoBuilder().build();
  const newBirthdate = "1995-03-15";
  const oldBeneficiaryBirthdate = "2002-10-05";

  const convention = new ConventionDtoBuilder()
    .withId(conventionId)
    .withStatus("ACCEPTED_BY_VALIDATOR")
    .withAgencyId(agency.id)
    .withBeneficiaryBirthdate(oldBeneficiaryBirthdate)
    .build();

  const backOfficeAdmin = new ConnectedUserBuilder()
    .withId("bcc5c20e-6dd2-45cf-affe-927358005262")
    .withIsAdmin(true)
    .build();

  const nonAdminUser = new ConnectedUserBuilder()
    .withId("bcc5c20e-6dd2-45cf-affe-927358005263")
    .withIsAdmin(false)
    .build();

  let uow: InMemoryUnitOfWork;
  let usecase: EditBeneficiaryBirthdate;

  beforeEach(() => {
    uow = createInMemoryUow();
    usecase = makeEditBeneficiaryBirthdate({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        createNewEvent: makeCreateNewEvent({
          timeGateway: new CustomTimeGateway(),
          uuidGenerator: new TestUuidGenerator(),
        }),
      },
    });
  });

  describe("Wrong paths", () => {
    it("throws when convention is not found", async () => {
      const nonExistentConventionId = "00000000-0000-4000-8000-000000000001";
      uow.userRepository.users = [backOfficeAdmin];
      uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId: nonExistentConventionId,
            updatedBeneficiaryBirthDate: newBirthdate,
            dateStart: convention.dateStart,
            internshipKind: convention.internshipKind,
          },
          backOfficeAdmin,
        ),
        errors.convention.notFound({
          conventionId: nonExistentConventionId,
        }),
      );
    });

    it("throws when convention status is not ACCEPTED_BY_VALIDATOR", async () => {
      const conventionInReview = new ConventionDtoBuilder(convention)
        .withStatus("IN_REVIEW")
        .build();
      uow.conventionRepository.setConventions([conventionInReview]);
      uow.userRepository.users = [backOfficeAdmin];
      uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId,
            updatedBeneficiaryBirthDate: newBirthdate,
            dateStart: conventionInReview.dateStart,
            internshipKind: conventionInReview.internshipKind,
          },
          backOfficeAdmin,
        ),
        errors.convention.editBeneficiaryBirthdateNotAllowedForStatus({
          status: "IN_REVIEW",
        }),
      );
    });

    it("throws when user is not back-office admin", async () => {
      uow.conventionRepository.setConventions([convention]);
      uow.userRepository.users = [nonAdminUser];
      uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId,
            updatedBeneficiaryBirthDate: newBirthdate,
            dateStart: convention.dateStart,
            internshipKind: convention.internshipKind,
          },
          nonAdminUser,
        ),
        errors.user.forbidden({ userId: nonAdminUser.id }),
      );
    });
  });

  describe("Right path", () => {
    it("updates beneficiary birthdate and saves ConventionBeneficiaryBirthdateEdited event when user is back-office admin", async () => {
      uow.conventionRepository.setConventions([convention]);
      uow.userRepository.users = [backOfficeAdmin];
      uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];

      await usecase.execute(
        {
          conventionId,
          updatedBeneficiaryBirthDate: newBirthdate,
          dateStart: convention.dateStart,
          internshipKind: convention.internshipKind,
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
          topic: "ConventionBeneficiaryBirthdateEdited",
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
