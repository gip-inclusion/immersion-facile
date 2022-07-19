import { AgencyDtoBuilder } from "shared/src/agency/AgencyDtoBuilder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
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
  let agencyRepository: InMemoryAgencyRepository;
  let listAgencies: ListAgenciesWithPosition;

  beforeEach(() => {
    const uow = createInMemoryUow();
    agencyRepository = uow.agencyRepository;
    listAgencies = new ListAgenciesWithPosition(new InMemoryUowPerformer(uow));
  });

  it("returns empty list when the repository is empty", async () => {
    agencyRepository.setAgencies([]);
    const agencies = await listAgencies.execute({ countyCode: 0 });
    expect(agencies).toEqual([]);
  });

  it("returns active stored agencies", async () => {
    agencyRepository.setAgencies([
      agency1,
      agency2,
      agencyInReview,
      agencyAddedFromPeReferencial,
    ]);

    const agencies = await listAgencies.execute({ countyCode: 75 });
    expect(agencies).toHaveLength(3);
    expect(agencies).toEqual([
      {
        id: agency1.id,
        name: agency1.name,
      },
      {
        id: agency2.id,
        name: agency2.name,
      },
      {
        id: agencyAddedFromPeReferencial.id,
        name: agencyAddedFromPeReferencial.name,
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
          .withPosition(20 + 0.01 * i, 20)
          .withCountyCode(75)
          .build(),
      );
    }

    agencyRepository.setAgencies(agencies);

    const nearestAgencies = await listAgencies.execute({
      countyCode: 75,
    });
    expect(nearestAgencies).toHaveLength(20);
    expect(nearestAgencies[0].id).toBe("0");
  });
});
