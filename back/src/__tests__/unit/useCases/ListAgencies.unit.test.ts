import { AgencyConfigBuilder } from "../../../_testBuilders/AgencyConfigBuilder";
import { InMemoryAgencyRepository } from "./../../../adapters/secondary/InMemoryAgencyRepository";
import { ListAgencies } from "./../../../domain/immersionApplication/useCases/ListAgencies";

const agency1 = AgencyConfigBuilder.empty()
  .withId("11111111-1111-1111-1111-111111111111")
  .withName("agency1")
  .build();

const agency2 = AgencyConfigBuilder.empty()
  .withId("22222222-2222-2222-2222-222222222222")
  .withName("agency2")
  .withPosition(10, 10)
  .build();

describe("ListAgencies", () => {
  test("returns empty list when the repository is empty", async () => {
    const repository = new InMemoryAgencyRepository([]);
    const listAgencies = new ListAgencies(repository);

    const agencies = await listAgencies.execute();
    expect(agencies).toEqual([]);
  });

  test("resturns stored agencies", async () => {
    const repository = new InMemoryAgencyRepository([agency1, agency2]);
    const listAgencies = new ListAgencies(repository);

    const agencies = await listAgencies.execute();
    expect(agencies).toEqual([
      {
        id: "11111111-1111-1111-1111-111111111111",
        name: "agency1",
        position: {
          lat: 0,
          lon: 0,
        },
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        name: "agency2",
        position: {
          lat: 10,
          lon: 10,
        },
      },
    ]);
  });
});
