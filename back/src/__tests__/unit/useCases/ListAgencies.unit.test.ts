import { AgencyConfigBuilder } from "../../../_testBuilders/AgencyConfigBuilder";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { ListAgencies } from "../../../domain/immersionApplication/useCases/ListAgencies";

const agency1 = AgencyConfigBuilder.empty()
  .withId("11111111-1111-1111-1111-111111111111")
  .withName("agency1")
  .build();

const agency2 = AgencyConfigBuilder.empty()
  .withId("22222222-2222-2222-2222-222222222222")
  .withName("agency2")
  .withPosition(10, 10)
  .build();

const agencyInReview = AgencyConfigBuilder.empty()
  .withId("33333333-3333-3333-3333-333333333333")
  .withName("agency3")
  .withStatus("needsReview")
  .withPosition(11, 10)
  .build();

describe("ListAgencies", () => {
  it("returns empty list when the repository is empty", async () => {
    const repository = new InMemoryAgencyRepository([]);
    const listAgencies = new ListAgencies(repository);

    const agencies = await listAgencies.execute({});
    expect(agencies).toEqual([]);
  });

  it("returns active stored agencies", async () => {
    const repository = new InMemoryAgencyRepository([
      agency1,
      agency2,
      agencyInReview,
    ]);
    const listAgencies = new ListAgencies(repository);

    const agencies = await listAgencies.execute({});
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

  it("returns 20 nearest agencies", async () => {
    const agencies = [];
    for (let i = 0; i < 100; i++) {
      agencies.push(
        AgencyConfigBuilder.empty()
          .withId(i.toString())
          .withName("agency " + i)
          .withPosition(i, i)
          .build(),
      );
    }

    const repository = new InMemoryAgencyRepository(agencies);
    const listAgencies = new ListAgencies(repository);

    const nearestAgencies = await listAgencies.execute({
      position: { lat: 20, lon: 20 },
    });
    expect(nearestAgencies).toHaveLength(20);
    expect(nearestAgencies[0].id).toBe("20");
  });
});
