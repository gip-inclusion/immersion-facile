import { appellationRoute, romeRoute } from "shared";
import { SuperTest, Test } from "supertest";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";

describe(`/${appellationRoute} route`, () => {
  let request: SuperTest<Test>;

  beforeEach(async () => {
    ({ request } = await buildTestApp());
  });

  it("forwards valid requests", async () => {
    await request.get(`/${appellationRoute}?searchText=rail`).expect(200, [
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

describe(`/${romeRoute} route`, () => {
  let request: SuperTest<Test>;

  beforeEach(async () => {
    ({ request } = await buildTestApp());
  });

  it("forwards valid requests", async () => {
    await request.get(`/${romeRoute}?searchText=rail`).expect(200, [
      {
        romeCode: "N4301",
        romeLabel: "Conduite sur rails",
      },
    ]);
  });
});
