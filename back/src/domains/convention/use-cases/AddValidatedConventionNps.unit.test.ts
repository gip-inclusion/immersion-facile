import { TallyForm, expectObjectsToMatch } from "shared";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { AddValidatedConventionNps } from "./AddValidatedConventionNps";

describe("AddValidatedConventionNps use case", () => {
  let uowPerformer: InMemoryUowPerformer;
  let addValidatedConventionNps: AddValidatedConventionNps;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    uowPerformer = new InMemoryUowPerformer(uow);

    addValidatedConventionNps = new AddValidatedConventionNps(uowPerformer);
  });

  it("saves the nps correctly", async () => {
    await addValidatedConventionNps.execute(tallyForm);
    const npsInRepo = await uow.npsRepository.nps;
    expect(npsInRepo).toHaveLength(1);
    expectObjectsToMatch(npsInRepo[0], {
      score: 5,
      respondentId: "7dg7a6",
      responseId: "BbrWpA",
      role: "beneficiary",
      comments: null,
      wouldHaveDoneWithoutIF: false,
      rawResult: tallyForm,
      conventionId: "21f72fda-8314-409b-9b31-08b9f3dc1c2f",
    });
  });
});

const tallyForm: TallyForm = {
  eventId: "4b9b7747-6bc2-46a7-b447-03f55f1a3a1b",
  eventType: "FORM_RESPONSE",
  createdAt: "2024-03-07T15:14:44.084Z",
  data: {
    responseId: "BbrWpA",
    submissionId: "BbrWpA",
    respondentId: "7dg7a6",
    formId: "nprlKZ",
    formName: "[NPS] NPS Convention validée",
    createdAt: "2024-03-07T15:14:41.000Z",
    fields: [
      {
        key: "question_mBPV55_9b77fd90-08be-440e-b919-a66e1ba38935",
        label: "id",
        type: "HIDDEN_FIELDS",
        value: "21f72fda-8314-409b-9b31-08b9f3dc1c2f",
      },
      {
        key: "question_wkVQx1_38f2b6f7-f22b-4bfe-a67e-fa8f3db52f88",
        label: "role",
        type: "HIDDEN_FIELDS",
        value: "beneficiary",
      },
      {
        key: "question_wvQvbv_855a1302-f8f8-4021-a9f3-b4b0d87246db",
        label: "status",
        type: "HIDDEN_FIELDS",
        value: null,
      },
      {
        key: "question_mKqNyA",
        label: null,
        type: "LINEAR_SCALE",
        value: 5,
      },
      {
        key: "question_XxOKKg",
        label: "Si vous pouvez nous en dire plus (facultatif) :",
        type: "TEXTAREA",
        value: null,
      },
      {
        key: "question_aQZbg9",
        label:
          "Auriez-vous fait cette immersion sans le site Immersion Facilitée (facultatif) ? ",
        type: "MULTIPLE_CHOICE",
        value: "9fffd475-0159-4e6a-9a8c-81ad96569048",
        options: [
          {
            id: "9fffd475-0159-4e6a-9a8c-81ad96569048",
            text: "Oui",
          },
          {
            id: "6f5588fa-c7a8-43f6-8d82-920e07c86677",
            text: "Non",
          },
        ],
      },
    ],
  },
};
