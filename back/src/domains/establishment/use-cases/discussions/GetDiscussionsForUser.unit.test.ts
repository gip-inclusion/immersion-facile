import {
  defaultPerPageInWebPagination,
  expectToEqual,
  maxPerPageInWebPagination,
} from "shared";
import { flatDiscussionQueryParamsToGetPaginatedDiscussionsParams } from "./GetDiscussionsForUser";

describe("GetDiscussionsForUser", () => {

  describe("flatDiscussionQueryParamsTogetPaginatedDiscussionsParams", () => {
    it("converts flat filters to correct filters", () => {
      const result = flatDiscussionQueryParamsToGetPaginatedDiscussionsParams({
        search: "siret1",
        statuses: ["PENDING", "ACCEPTED"],
      });
      expectToEqual(result, {
        filters: {
          search: "siret1",
          statuses: ["PENDING", "ACCEPTED"],
        },
        sort: { by: "createdAt", direction: "desc" },
        pagination: { page: 1, perPage: defaultPerPageInWebPagination },
      });
    });

    it("returns unfiltered results when no status or siret is provided", () => {
      const result = flatDiscussionQueryParamsToGetPaginatedDiscussionsParams(
        {},
      );
      expectToEqual(result, {
        sort: { by: "createdAt", direction: "desc" },
        pagination: { page: 1, perPage: defaultPerPageInWebPagination },
      });
    });

    it("wraps a single status in an array", () => {
      const result = flatDiscussionQueryParamsToGetPaginatedDiscussionsParams({
        statuses: "PENDING",
      });
      expectToEqual(result, {
        filters: {
          statuses: ["PENDING"],
        },
        sort: { by: "createdAt", direction: "desc" },
        pagination: { page: 1, perPage: defaultPerPageInWebPagination },
      });
    });

    it("adds a default order by createdAt, desc if none is provided", () => {
      const result = flatDiscussionQueryParamsToGetPaginatedDiscussionsParams(
        {},
      );
      expectToEqual(result, {
        sort: { by: "createdAt", direction: "desc" },
        pagination: { page: 1, perPage: defaultPerPageInWebPagination },
      });
    });

    it("uses provided order properties when they exist", () => {
      const result = flatDiscussionQueryParamsToGetPaginatedDiscussionsParams({
        orderBy: "createdAt",
        orderDirection: "asc",
      });
      expectToEqual(result, {
        sort: { by: "createdAt", direction: "asc" },
        pagination: { page: 1, perPage: defaultPerPageInWebPagination },
      });
    });

    it("makes sure pagination is in the correct range, and max it to defaultPerPageInWebPagination", () => {
      const result = flatDiscussionQueryParamsToGetPaginatedDiscussionsParams({
        page: 2,
        perPage: 150,
      });
      expectToEqual(result, {
        sort: { by: "createdAt", direction: "desc" },
        pagination: { page: 2, perPage: maxPerPageInWebPagination },
      });
    });
  });

  // it("return no discussions if user has no ACCEPTED status on any establishment right", async () => {
  //   uow = createInMemoryUow();

  //   const userId: UserId = "userIaaaaad2c-6f02-11ec-90d6-0242ac120004d";
  //   const establishmentAggregate = new EstablishmentAggregateBuilder()
  //     .withUserRights([
  //       {
  //         userId,
  //         status: "PENDING",
  //         role: "establishment-contact",
  //         shouldReceiveDiscussionNotifications: true,
  //       },
  //     ])
  //     .build();
  //   const discussionsForEstablishment = [
  //     new DiscussionBuilder()
  //       .withSiret(establishmentAggregate.establishment.siret)
  //       .buildRead(),
  //   ];

  //   const connectedUser = new ConnectedUserBuilder().withId(userId).build();

  //   await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
  //     establishmentAggregate,
  //   );
  //   uow.discussionRepository.discussionsForUser = discussionsForEstablishment;
  //   await uow.userRepository.save(connectedUser);

  //   const params = {
  //     page: 1,
  //     perPage: 150,
  //   };

  //   const getDiscussionsForUser = makeGetDiscussionsForUser({
  //     uowPerformer: new InMemoryUowPerformer(uow),
  //   });

  //   expectArraysToEqual(
  //     (await getDiscussionsForUser.execute(params, connectedUser)).data,
  //     [],
  //   );
  // });

  it("return no discussions if user has no sufficient rights on establishment", async () => {
    expect(true).toBe(false);
  });
});
