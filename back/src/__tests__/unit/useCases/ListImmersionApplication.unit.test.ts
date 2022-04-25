import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import { ImmersionApplicationEntity } from "../../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { ListImmersionApplication } from "../../../domain/immersionApplication/useCases/ListImmersionApplication";
import { AgencyId } from "../../../shared/agency/agency.dto";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
import { validApplicationStatus } from "../../../shared/ImmersionApplication/ImmersionApplication.dto";

const agencyIds: AgencyId[] = [
  "11111111-1111-1111-1111-111111111111",
  "22222222-2222-2222-2222-222222222222",
  "33333333-3333-3333-3333-333333333333",
];

describe("List Immersion Applications", () => {
  let listImmersionApplication: ListImmersionApplication;
  let repository: InMemoryImmersionApplicationRepository;

  beforeEach(() => {
    repository = new InMemoryImmersionApplicationRepository();
    listImmersionApplication = new ListImmersionApplication(repository);
  });

  describe("When the repository is empty", () => {
    it("returns empty list", async () => {
      const immersionApplications = await listImmersionApplication.execute({
        status: undefined,
        agencyId: undefined,
      });
      expect(immersionApplications).toEqual([]);
    });
  });

  describe("When a immersionApplication is stored", () => {
    it("returns the immersionApplication", async () => {
      const entity = new ImmersionApplicationEntityBuilder().build();
      repository.setImmersionApplications({ form_id: entity });

      const immersionApplications = await listImmersionApplication.execute({
        status: undefined,
        agencyId: undefined,
      });
      expect(immersionApplications).toEqual([entity.toDto()]);
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

      repository.setImmersionApplications(
        entities.reduce(
          (dict, entity) => ({ ...dict, [entity.id as string]: entity }),
          {},
        ),
      );
    });

    it("without filters returns all applications", async () => {
      const immersionApplications = await listImmersionApplication.execute({
        status: undefined,
        agencyId: undefined,
      });
      expect(immersionApplications).toHaveLength(applicationCount);
    });

    it("with agency filter returns all applications of the agency", async () => {
      const immersionApplications = await listImmersionApplication.execute({
        status: undefined,
        agencyId: agencyIds[0],
      });
      expect(immersionApplications).toHaveLength(validApplicationStatus.length);
      immersionApplications.forEach((entity) => {
        expect(entity.agencyId).toEqual(agencyIds[0]);
      });
    });

    it("with status filter returns all applications with a given status", async () => {
      const immersionApplications = await listImmersionApplication.execute({
        status: validApplicationStatus[0],
        agencyId: undefined,
      });
      expect(immersionApplications).toHaveLength(agencyIds.length);
      immersionApplications.forEach((entity) => {
        expect(entity.status).toEqual(validApplicationStatus[0]);
      });
    });

    it("with multiple filters, applies all filters as logical AND", async () => {
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
