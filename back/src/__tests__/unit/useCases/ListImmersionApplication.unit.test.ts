import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import { ImmersionApplicationEntity } from "../../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { ListImmersionApplication } from "../../../domain/immersionApplication/useCases/ListImmersionApplication";
import { AgencyId } from "../../../shared/agencies";
import { FeatureFlags } from "../../../shared/featureFlags";
import { validApplicationStatus } from "../../../shared/ImmersionApplicationDto";
import { FeatureFlagsBuilder } from "../../../_testBuilders/FeatureFlagsBuilder";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";

const agencyIds: AgencyId[] = [
  "11111111-1111-1111-1111-111111111111",
  "22222222-2222-2222-2222-222222222222",
  "33333333-3333-3333-3333-333333333333",
];

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
        agencyId: undefined,
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
        agencyId: undefined,
      });
      expect(ImmersionApplications).toEqual([entity.toDto()]);
    });
  });

  describe("filters", () => {
    let applicationCount = 0;

    // Populate the DB with 1 record of with all possible statuses and a set of agency ids.
    beforeEach(async () => {
      const entities: ImmersionApplicationEntity[] = [];

      validApplicationStatus.forEach((status) => {
        agencyIds.forEach((agencyId) => {
          entities.push(
            ImmersionApplicationEntity.create(
              new ImmersionApplicationDtoBuilder()
                .withAgencyId(agencyId)
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
        agencyId: undefined,
      });
      expect(immersionApplications).toHaveLength(applicationCount);
    });

    test("with agency filter returns all applications of the agency", async () => {
      const immersionApplications = await listImmersionApplication.execute({
        status: undefined,
        agencyId: agencyIds[0],
      });
      expect(immersionApplications).toHaveLength(validApplicationStatus.length);
      immersionApplications.forEach((entity) => {
        expect(entity.agencyId).toEqual(agencyIds[0]);
      });
    });

    test("with status filter returns all applications with a given status", async () => {
      const immersionApplications = await listImmersionApplication.execute({
        status: validApplicationStatus[0],
        agencyId: undefined,
      });
      expect(immersionApplications).toHaveLength(agencyIds.length);
      immersionApplications.forEach((entity) => {
        expect(entity.status).toEqual(validApplicationStatus[0]);
      });
    });

    test("with multiple filters, applies all filters as logical AND", async () => {
      const immersionApplications = await listImmersionApplication.execute({
        status: validApplicationStatus[0],
        agencyId: agencyIds[0],
      });
      expect(immersionApplications).toHaveLength(1);
      expect(immersionApplications[0].status).toEqual(
        validApplicationStatus[0],
      );
      expect(immersionApplications[0].agencyId).toEqual(agencyIds[0]);
    });
  });
});
