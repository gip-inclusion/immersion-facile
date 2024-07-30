import { errors, expectPromiseToFailWithError, expectToEqual } from "shared";
import { ZodError } from "zod";
import { ApiConsumerBuilder } from "../../api-consumer/adapters/InMemoryApiConsumerRepository";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../unit-of-work/adapters/createInMemoryUow";
import { fakeEstablishmentStatsResponse } from "../adapters/InMemoryStatisticQueries";
import {
  GetEstablishmentStats,
  makeGetEstablishmentStats,
} from "./GetEstablishmentStats";

const apiConsumer = new ApiConsumerBuilder()
  .withRights({
    statistics: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
  })
  .build();

describe("GetEstablishmentStats", () => {
  let getEstablishmentStats: GetEstablishmentStats;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    getEstablishmentStats = makeGetEstablishmentStats({ uowPerformer });
  });

  it("throws Forbidden if ApiConsumer does not have 'READ' right on establishmentStats", async () => {
    const apiConsumerWithoutReadRight = new ApiConsumerBuilder()
      .withRights({
        statistics: { kinds: [], scope: "no-scope", subscriptions: [] },
      })
      .build();

    await expectPromiseToFailWithError(
      getEstablishmentStats.execute(
        {
          page: 1,
          perPage: 10,
        },
        apiConsumerWithoutReadRight,
      ),
      errors.apiConsumer.notEnoughPrivilege(),
    );
  });

  it("throws BadRequest if perPage is greater than the max allowed", async () => {
    await expectPromiseToFailWithError(
      getEstablishmentStats.execute(
        {
          page: 1,
          perPage: 100_000,
        },
        apiConsumer,
      ),
      errors.inputs.badSchema({
        zodError: new ZodError([
          {
            code: "too_big",
            maximum: 5000,
            type: "number",
            inclusive: true,
            exact: false,
            message: "Number must be less than or equal to 5000",
            path: ["perPage"],
          },
        ]),
      }),
    );
  });

  it("gets the content", async () => {
    const result = await getEstablishmentStats.execute(
      {
        page: 1,
        perPage: 1000,
      },
      apiConsumer,
    );
    expectToEqual(result, fakeEstablishmentStatsResponse);
  });
});
