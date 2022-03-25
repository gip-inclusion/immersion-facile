import supertest, { SuperTest, Test } from "supertest";
import { createApp } from "../../adapters/primary/server";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";

describe("/appellation route", () => {
  let request: SuperTest<Test>;

  beforeEach(async () => {
    const { app } = await createApp(new AppConfigBuilder().build());
    request = supertest(app);
  });

  it("forwards valid requests", async () => {
    await request.get(`/appellation?searchText=rail`).expect(200, [
      {
        appellation: {
          appellationCode: "20714",
          appellationLabel: "Vitrailliste",
          romeCode: "B1602",
          romeLabel: "Vitraillerie",
        },
        matchRanges: [
          {
            startIndexInclusive: 3,
            endIndexExclusive: 7,
          },
        ],
      },
    ]);
  });
});

describe("/rome route", () => {
  let request: SuperTest<Test>;

  beforeEach(async () => {
    const { app } = await createApp(new AppConfigBuilder().build());
    request = supertest(app);
  });

  it("forwards valid requests", async () => {
    await request.get(`/rome?searchText=rail`).expect(200, [
      {
        romeCode: "N4301",
        romeLabel: "Conduite sur rails",
      },
    ]);
  });
});
