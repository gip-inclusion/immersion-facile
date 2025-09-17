import type {
  DataWithPagination,
  GetOffersFlatQueryParams,
  SearchResultDto,
} from "shared";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import type { EstablishmentUserRight } from "../entities/EstablishmentAggregate";
import {
  boulangerOffer,
  EstablishmentAggregateBuilder,
  secretariatOffer,
} from "../helpers/EstablishmentBuilders";
import { makeGetOffers } from "./GetOffers";

describe("GetOffers", () => {
  const userRights: EstablishmentUserRight[] = [
    {
      userId: "test-user-id",
      role: "establishment-admin",
      job: "Chef",
      phone: "+33600000000",
      shouldReceiveDiscussionNotifications: true,
      isMainContactByPhone: false,
    },
  ];

  const establishment1 = new EstablishmentAggregateBuilder()
    .withEstablishmentSiret("78000403200019")
    .withEstablishmentNaf({ code: "8560C", nomenclature: "naf nomenclature" })
    .withFitForDisabledWorkers(false)
    .withScore(100)
    .withOffers([secretariatOffer, boulangerOffer])
    .withUserRights(userRights)
    .build();

  const establishment2 = new EstablishmentAggregateBuilder()
    .withEstablishmentSiret("12345678901234")
    .withEstablishmentNaf({ code: "7510A", nomenclature: "naf nomenclature" })
    .withFitForDisabledWorkers(true)
    .withScore(80)
    .withOffers([secretariatOffer])
    .withUserRights(userRights)
    .build();

  const establishment3 = new EstablishmentAggregateBuilder()
    .withEstablishmentSiret("98765432109876")
    .withEstablishmentNaf({ code: "6201Z", nomenclature: "naf nomenclature" })
    .withFitForDisabledWorkers(false)
    .withScore(120)
    .withOffers([boulangerOffer])
    .withUserRights(userRights)
    .build();

  let uow: InMemoryUnitOfWork;
  let uuidGenerator: TestUuidGenerator;
  let getOffers: ReturnType<typeof makeGetOffers>;

  beforeEach(() => {
    uow = createInMemoryUow();
    uuidGenerator = new TestUuidGenerator();
    getOffers = makeGetOffers({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        uuidGenerator,
      },
    });
    uuidGenerator.setNextUuid("search-made-uuid");
  });

  it("should return some results given the input (with pretty much all filters)", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment1,
      establishment2,
      establishment3,
    ];

    const searchParams: GetOffersFlatQueryParams = {
      sortBy: "score",
      sortOrder: "desc",
      appellationCodes: [secretariatOffer.appellationCode],
      fitForDisabledWorkers: true,
      nafCodes: ["7510A"],
      searchableBy: "jobSeekers",
      sirets: [establishment2.establishment.siret],
    };

    const result: DataWithPagination<SearchResultDto> =
      await getOffers.execute(searchParams);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].siret).toBe(establishment2.establishment.siret);
    expect(result.data[0].appellations[0].appellationCode).toBe(
      secretariatOffer.appellationCode,
    );

    expect(uow.searchMadeRepository.searchesMade).toHaveLength(1);
    expect(uow.searchMadeRepository.searchesMade[0].numberOfResults).toBe(
      result.pagination.totalRecords,
    );
  });

  it("should return more results when no filters", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment1,
      establishment2,
      establishment3,
    ];

    const resultWithoutFilters = await getOffers.execute({
      sortBy: "date",
      sortOrder: "desc",
    });

    expect(resultWithoutFilters.data).toHaveLength(4);
    expect(resultWithoutFilters.pagination.totalRecords).toBe(4);

    expect(uow.searchMadeRepository.searchesMade).toHaveLength(1);
    expect(uow.searchMadeRepository.searchesMade[0].numberOfResults).toBe(4);
    expect(uow.searchMadeRepository.searchesMade[0].numberOfResults).toBe(
      resultWithoutFilters.pagination.totalRecords,
    );
  });
});
