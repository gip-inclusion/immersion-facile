import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { ForbiddenError } from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { ApiConsumerBuilder } from "../../core/api-consumer/adapters/InMemoryApiConsumerRepository";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { GetConventionsForApiConsumer } from "./GetConventionsForApiConsumer";

describe("Get Conventions for ApiConsumer", () => {
  const agencyFranceTravail = new AgencyDtoBuilder()
    .withId("agency-france-travail")
    .withKind("pole-emploi")
    .build();

  const agencyMissionLocale = new AgencyDtoBuilder()
    .withId("agency-mission-locale")
    .withKind("mission-locale")
    .build();

  const conventionFranceTravail = new ConventionDtoBuilder()
    .withId("convention-france-travail-id")
    .withAgencyId(agencyFranceTravail.id)
    .withStatus("IN_REVIEW")
    .build();

  const conventionMissionLocale = new ConventionDtoBuilder()
    .withId("convention-mission-locale-id")
    .withAgencyId(agencyMissionLocale.id)
    .build();

  let getConventionsForApiConsumer: GetConventionsForApiConsumer;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    uow.agencyRepository.agencies = [
      toAgencyWithRights(agencyFranceTravail),
      toAgencyWithRights(agencyMissionLocale),
    ];
    uow.conventionRepository.setConventions([
      conventionFranceTravail,
      conventionMissionLocale,
    ]);
    getConventionsForApiConsumer = new GetConventionsForApiConsumer(
      new InMemoryUowPerformer(uow),
    );
  });

  describe("Forbidden error", () => {
    it("When no api consumer is provided", async () => {
      await expectPromiseToFailWithError(
        getConventionsForApiConsumer.execute({}),
        new ForbiddenError("No api consumer provided"),
      );
    });
  });

  describe("returns only conventions in scope", () => {
    describe("when only agencyKinds", () => {
      it("return empty array no convention matching agencyKinds", async () => {
        const apiConsumer = new ApiConsumerBuilder()
          .withConventionRight({
            scope: {
              agencyKinds: ["cci"],
            },
            kinds: ["READ"],
            subscriptions: [],
          })
          .build();

        const conventions = await getConventionsForApiConsumer.execute(
          {},
          apiConsumer,
        );

        expectToEqual(conventions, []);
      });

      it("return convention matching agencyKinds", async () => {
        const apiConsumer = new ApiConsumerBuilder()
          .withConventionRight({
            scope: {
              agencyKinds: ["pole-emploi"],
            },
            kinds: ["READ"],
            subscriptions: [],
          })
          .build();

        const retrievedConventions = await getConventionsForApiConsumer.execute(
          {},
          apiConsumer,
        );

        expectToEqual(retrievedConventions, [
          {
            ...conventionFranceTravail,
            agencyName: agencyFranceTravail.name,
            agencyDepartment: agencyFranceTravail.address.departmentCode,
            agencyKind: agencyFranceTravail.kind,
            agencySiret: agencyFranceTravail.agencySiret,
            agencyCounsellorEmails: agencyFranceTravail.counsellorEmails,
            agencyValidatorEmails: agencyFranceTravail.validatorEmails,
          },
        ]);
      });

      it("return convention matching agencyKinds with status IN_REVIEW", async () => {
        const apiConsumer = new ApiConsumerBuilder()
          .withConventionRight({
            scope: {
              agencyKinds: ["pole-emploi", "mission-locale"],
            },
            kinds: ["READ"],
            subscriptions: [],
          })
          .build();

        const retrievedConventions = await getConventionsForApiConsumer.execute(
          {
            withStatuses: ["IN_REVIEW"],
          },
          apiConsumer,
        );

        expectToEqual(retrievedConventions, [
          {
            ...conventionFranceTravail,
            agencyName: agencyFranceTravail.name,
            agencyDepartment: agencyFranceTravail.address.departmentCode,
            agencyKind: agencyFranceTravail.kind,
            agencySiret: agencyFranceTravail.agencySiret,
            agencyCounsellorEmails: agencyFranceTravail.counsellorEmails,
            agencyValidatorEmails: agencyFranceTravail.validatorEmails,
          },
        ]);
      });
    });

    describe("when only agencyIds", () => {
      it("return empty array no convention matching agencyIds", async () => {
        const apiConsumer = new ApiConsumerBuilder()
          .withConventionRight({
            scope: {
              agencyIds: ["any-agency-id"],
            },
            kinds: ["READ"],
            subscriptions: [],
          })
          .build();

        const conventions = await getConventionsForApiConsumer.execute(
          {},
          apiConsumer,
        );

        expectToEqual(conventions, []);
      });

      it("return convention matching agencyIds", async () => {
        const apiConsumer = new ApiConsumerBuilder()
          .withConventionRight({
            scope: {
              agencyIds: [agencyMissionLocale.id],
            },
            kinds: ["READ"],
            subscriptions: [],
          })
          .build();

        const retrievedConventions = await getConventionsForApiConsumer.execute(
          {},
          apiConsumer,
        );

        expectToEqual(retrievedConventions, [
          {
            ...conventionMissionLocale,
            agencyName: agencyMissionLocale.name,
            agencyDepartment: agencyMissionLocale.address.departmentCode,
            agencyKind: agencyMissionLocale.kind,
            agencySiret: agencyMissionLocale.agencySiret,
            agencyCounsellorEmails: agencyMissionLocale.counsellorEmails,
            agencyValidatorEmails: agencyMissionLocale.validatorEmails,
          },
        ]);
      });
    });
  });
});
