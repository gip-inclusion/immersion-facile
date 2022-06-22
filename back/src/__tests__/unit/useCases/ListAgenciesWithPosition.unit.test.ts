import { AgencyDtoBuilder } from "shared/src/agency/AgencyDtoBuilder";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { ListAgenciesWithPosition } from "../../../domain/convention/useCases/ListAgenciesWithPosition";

const agency1 = AgencyDtoBuilder.empty()
  .withId("11111111-1111-1111-1111-111111111111")
  .withName("agency1")
  .build();

const agency2 = AgencyDtoBuilder.empty()
  .withId("22222222-2222-2222-2222-222222222222")
  .withName("agency2")
  .withPosition(10, 10)
  .build();

const agencyInReview = AgencyDtoBuilder.empty()
  .withId("33333333-3333-3333-3333-333333333333")
  .withName("agency3")
  .withStatus("needsReview")
  .withPosition(11, 10)
  .build();

const agencyAddedFromPeReferencial = AgencyDtoBuilder.empty()
  .withId("44444444-4444-4444-4444-444444444444")
  .withName("agency4")
  .withPosition(10, 10)
  .withStatus("from-api-PE")
  .build();

describe("ListAgencies", () => {
  it("returns empty list when the repository is empty", async () => {
    const repository = new InMemoryAgencyRepository([]);
    const listAgencies = new ListAgenciesWithPosition(repository);

    const agencies = await listAgencies.execute({});
    expect(agencies).toEqual([]);
  });

  it("returns active stored agencies", async () => {
    const repository = new InMemoryAgencyRepository([
      agency1,
      agency2,
      agencyInReview,
      agencyAddedFromPeReferencial,
    ]);
    const listAgencies = new ListAgenciesWithPosition(repository);

    const agencies = await listAgencies.execute({});
    expect(agencies).toEqual([
      {
        id: agency1.id,
        name: agency1.name,
        position: agency1.position,
      },
      {
        id: agency2.id,
        name: agency2.name,
        position: agency2.position,
      },
      {
        id: agencyAddedFromPeReferencial.id,
        name: agencyAddedFromPeReferencial.name,
        position: agencyAddedFromPeReferencial.position,
      },
    ]);
  });

  it("returns 20 nearest agencies", async () => {
    const agencies = [];
    for (let i = 0; i < 100; i++) {
      agencies.push(
        AgencyDtoBuilder.empty()
          .withId(i.toString())
          .withName("agency " + i)
          .withPosition(i, i)
          .build(),
      );
    }

    const repository = new InMemoryAgencyRepository(agencies);
    const listAgencies = new ListAgenciesWithPosition(repository);

    const nearestAgencies = await listAgencies.execute({
      lat: 20,
      lon: 20,
    });
    expect(nearestAgencies).toHaveLength(20);
    expect(nearestAgencies[0].id).toBe("20");
  });
});
