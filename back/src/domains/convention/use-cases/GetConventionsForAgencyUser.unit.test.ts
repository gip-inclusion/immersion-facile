import {
  ConventionDtoBuilder,
  type GetConventionsForAgencyUserParams,
  InclusionConnectedUserBuilder,
  maxPerPageInWebPagination,
} from "shared";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { makeGetConventionsForAgencyUser } from "./GetConventionsForAgencyUser";

describe("GetConventionsForAgencyUser", () => {
  const agencyUserId = "agency-user-id-12345";
  const currentUser = new InclusionConnectedUserBuilder()
    .withId(agencyUserId)
    .withEmail("counsellor1@email.com")
    .withFirstName("John")
    .withLastName("Doe")
    .build();

  const conventions = Array.from({ length: 30 }, (_, i) =>
    new ConventionDtoBuilder()
      .withId(`convention-id-${i + 1}`)
      .withStatus(i % 2 === 0 ? "ACCEPTED_BY_VALIDATOR" : "DRAFT")
      .build(),
  );

  let getConventionsForAgencyUser: ReturnType<
    typeof makeGetConventionsForAgencyUser
  >;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    getConventionsForAgencyUser = makeGetConventionsForAgencyUser({
      uowPerformer,
    });

    uow.conventionRepository.setConventions(conventions);
  });

  describe("Pagination", () => {
    it("should limit perPage to maxPerPageInWebPagination (100) even if a larger value is provided", async () => {
      const params: GetConventionsForAgencyUserParams = {
        filters: {},
        pagination: {
          page: 1,
          perPage: 500, // Much larger than the max
        },
      };

      await getConventionsForAgencyUser.execute(params, currentUser);

      const calls = uow.conventionQueries.paginatedConventionsParams;
      expect(calls.length).toBe(1);
      expect(calls[0].pagination.perPage).toBe(maxPerPageInWebPagination);
    });
  });

  describe("Filtering", () => {
    it("should pass filters to the query", async () => {
      const params: GetConventionsForAgencyUserParams = {
        filters: {
          statuses: ["ACCEPTED_BY_VALIDATOR"],
        },
      };

      await getConventionsForAgencyUser.execute(params, currentUser);

      const calls = uow.conventionQueries.paginatedConventionsParams;
      expect(calls.length).toBe(1);
      expect(calls[0].filters).toEqual(params.filters);
    });
  });
});
