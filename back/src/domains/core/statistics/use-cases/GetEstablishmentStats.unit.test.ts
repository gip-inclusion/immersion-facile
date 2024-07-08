import { expectPromiseToFailWithError } from "shared";
import {
  BadRequestError,
  ForbiddenError,
} from "../../../../config/helpers/httpErrors";
import { ApiConsumerBuilder } from "../../api-consumer/adapters/InMemoryApiConsumerRepository";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../unit-of-work/adapters/createInMemoryUow";
import {
  GetEstablishmentStats,
  makeGetEstablishmentStats,
} from "./GetEstablishmentStats";

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
      new ForbiddenError(
        "You don't have sufficient rights to access this route. Contact support if you want more privileges.",
      ),
    );
  });

  it("throws BadRequest if perPage is greater than the max allowed", async () => {
    const apiConsumer = new ApiConsumerBuilder()
      .withRights({
        statistics: {
          kinds: ["READ"],
          scope: "no-scope",
          subscriptions: [],
        },
      })
      .build();

    await expectPromiseToFailWithError(
      getEstablishmentStats.execute(
        {
          page: 1,
          perPage: 100_000,
        },
        apiConsumer,
      ),
      new BadRequestError(
        JSON.stringify(
          [
            {
              code: "too_big",
              maximum: 5000,
              type: "number",
              inclusive: true,
              exact: false,
              message: "Number must be less than or equal to 5000",
              path: ["perPage"],
            },
          ],
          null,
          2,
        ),
      ),
    );
  });
});
