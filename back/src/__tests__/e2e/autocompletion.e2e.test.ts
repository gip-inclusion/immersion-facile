import { SuperTest, Test } from "supertest";
import { buildTestApp } from "../../_testBuilders/buildTestApp";

describe("/appellation route", () => {
  let request: SuperTest<Test>;

  beforeEach(async () => {
    ({ request } = await buildTestApp());
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
    ({ request } = await buildTestApp());
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
