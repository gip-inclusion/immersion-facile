import supertest, { SuperTest, Test } from "supertest";
import { createApp } from "../../adapters/primary/server";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";

describe("/rome route", () => {
  let request: SuperTest<Test>;

  beforeEach(() => {
    request = supertest(createApp(new AppConfigBuilder().build()));
  });

  it("forwards valid requests", async () => {
    await request.get(`/rome?searchText=rail`).expect(200, [
      {
        profession: {
          romeCodeAppellation: "20714",
          description: "Vitrailliste",
        },
        matchRanges: [
          {
            startIndexInclusive: 3,
            endIndexExclusive: 7,
          },
        ],
      },
      {
        profession: {
          romeCodeMetier: "N4301",
          description: "Conduite sur rails",
        },
        matchRanges: [
          {
            startIndexInclusive: 13,
            endIndexExclusive: 17,
          },
        ],
      },
    ]);
  });
});
