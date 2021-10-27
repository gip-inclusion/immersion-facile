import { validAgencyCodes } from "./../../../shared/agencies";
import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import { ListImmersionApplication } from "../../../domain/immersionApplication/useCases/ListImmersionApplication";
import { FeatureFlags } from "../../../shared/featureFlags";
import { validApplicationStatus } from "../../../shared/ImmersionApplicationDto";
import { FeatureFlagsBuilder } from "../../../_testBuilders/FeatureFlagsBuilder";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
import { ImmersionApplicationEntity } from "../../../domain/immersionApplication/entities/ImmersionApplicationEntity";

describe("List Immersion Applications", () => {
  let listImmersionApplication: ListImmersionApplication;
  let repository: InMemoryImmersionApplicationRepository;
  let featureFlags: FeatureFlags;

  beforeEach(() => {
    repository = new InMemoryImmersionApplicationRepository();
    featureFlags = FeatureFlagsBuilder.allOff().build();
    listImmersionApplication = new ListImmersionApplication(repository);
  });

  describe("When the repository is empty", () => {
    test("returns empty list", async () => {
      const ImmersionApplications = await listImmersionApplication.execute({
        status: undefined,
        agencyCode: undefined,
      });
      expect(ImmersionApplications).toEqual([]);
    });
  });

  describe("When a immersionApplication is stored", () => {
    test("returns the immersionApplication", async () => {
      const entity = new ImmersionApplicationEntityBuilder().build();
      repository.setDemandesImmersion({ form_id: entity });

      const ImmersionApplications = await listImmersionApplication.execute({
        status: undefined,
        agencyCode: undefined,
      });
      expect(ImmersionApplications).toEqual([entity.toDto()]);
    });
  });

  describe("filters", () => {
    let applicationCount = 0;

    // Populate the DB with 1 record of with all possible statuses, agency codes.
    beforeEach(async () => {
      const entities: ImmersionApplicationEntity[] = [];

      validApplicationStatus.forEach((status) => {
        validAgencyCodes.forEach((agencyCode) => {
          entities.push(
            ImmersionApplicationEntity.create(
              new ImmersionApplicationDtoBuilder()
                .withAgencyCode(agencyCode)
                .withStatus(status)
                .withId(`id-${applicationCount}`)
                .build(),
            ),
          );
          applicationCount++;
        });
      });

      repository.setDemandesImmersion(
        entities.reduce(
          (dict, entity) => ({ ...dict, [entity.id as string]: entity }),
          {},
        ),
      );
    });

    test("without filters returns all applications", async () => {
      const immersionApplications = await listImmersionApplication.execute({
        status: undefined,
        agencyCode: undefined,
      });
      expect(immersionApplications).toHaveLength(applicationCount);
    });

    test("with agency filter returns all applications of the agency", async () => {
      const immersionApplications = await listImmersionApplication.execute({
        status: undefined,
        agencyCode: validAgencyCodes[0],
      });
      expect(immersionApplications).toHaveLength(validApplicationStatus.length);
      immersionApplications.forEach((entity) => {
        expect(entity.agencyCode).toEqual(validAgencyCodes[0]);
      });
    });

    test("with status filter returns all applications with a given status", async () => {
      const immersionApplications = await listImmersionApplication.execute({
        status: validApplicationStatus[0],
        agencyCode: undefined,
      });
      expect(immersionApplications).toHaveLength(validAgencyCodes.length);
      immersionApplications.forEach((entity) => {
        expect(entity.status).toEqual(validApplicationStatus[0]);
      });
    });

    test("with multiple filters, applies all filters as logical AND", async () => {
      const immersionApplications = await listImmersionApplication.execute({
        status: validApplicationStatus[0],
        agencyCode: validAgencyCodes[0],
      });
      expect(immersionApplications).toHaveLength(1);
      expect(immersionApplications[0].status).toEqual(
        validApplicationStatus[0],
      );
      expect(immersionApplications[0].agencyCode).toEqual(validAgencyCodes[0]);
    });
  });
});
