import { displayRouteName, expectHttpResponseToEqual } from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { authorizedUnJeuneUneSolutionApiConsumer } from "../../../../domains/core/api-consumer/adapters/InMemoryApiConsumerRepository";
import { fakeEstablishmentStatsResponse } from "../../../../domains/core/statistics/adapters/InMemoryStatisticQueries";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { buildTestApp } from "../../../../utils/buildTestApp";
import {
  PublicApiV2StatisticsRoutes,
  publicApiV2StatisticsRoutes,
} from "./publicApiV2.routes";

describe("Statistics routes", () => {
  let httpClient: HttpClient<PublicApiV2StatisticsRoutes>;
  let uow: InMemoryUnitOfWork;
  let authToken: string;

  beforeEach(async () => {
    const { request, inMemoryUow, generateApiConsumerJwt } =
      await buildTestApp();
    uow = inMemoryUow;
    uow.apiConsumerRepository.consumers = [
      authorizedUnJeuneUneSolutionApiConsumer,
    ];
    authToken = generateApiConsumerJwt({
      id: authorizedUnJeuneUneSolutionApiConsumer.id,
    });
    httpClient = createSupertestSharedClient(
      publicApiV2StatisticsRoutes,
      request,
    );
  });

  describe(`${displayRouteName(
    publicApiV2StatisticsRoutes.getEstablishmentStats,
  )} gets establishments stats`, () => {
    it("401 - when wrong token is provided", async () => {
      const response = await httpClient.getEstablishmentStats({
        headers: {
          authorization: "wrong-token",
        },
        queryParams: {
          page: 1,
          perPage: 100,
        },
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: { message: "incorrect Jwt", status: 401 },
      });
    });

    it("200 - gets paginated stats for establishments", async () => {
      const response = await httpClient.getEstablishmentStats({
        headers: { authorization: authToken },
        queryParams: {
          page: 1,
          perPage: 100,
        },
      });

      expectHttpResponseToEqual(response, {
        status: 200,
        body: fakeEstablishmentStatsResponse,
      });
    });
  });
});
