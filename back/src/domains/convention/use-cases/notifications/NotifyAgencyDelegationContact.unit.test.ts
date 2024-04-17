import {
  TallyForm,
  expectPromiseToFailWithError,
  getTallyFormValueOf,
} from "shared";
import { BadRequestError } from "../../../../config/helpers/httpErrors";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationsAndEvents";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  NotifyAgencyDelegationContact,
  delegationContactEmailByProvince,
} from "./NotifyAgencyDelegationContact";

describe("NotifyAgencyDelegationContact", () => {
  let usecase: NotifyAgencyDelegationContact;
  let uow: InMemoryUnitOfWork;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    const uuidGenerator = new UuidV4Generator();
    const timeGateway = new CustomTimeGateway();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );
    uow = createInMemoryUow();
    usecase = new NotifyAgencyDelegationContact(
      new InMemoryUowPerformer(uow),
      saveNotificationAndRelatedEvent,
    );
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
  });

  it("fail if tallyForm does not contain requested label", async () => {
    await expectPromiseToFailWithError(
      usecase.execute(wrongTallyForm),
      new BadRequestError('No value found for label "Email"'),
    );
  });

  it("send an email to agency", async () => {
    await usecase.execute(tallyForm);

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "AGENCY_DELEGATION_CONTACT_INFORMATION",
          recipients: [tallyForm.data.fields[2].value],
          params: {
            firstName: getTallyFormValueOf(tallyForm, "Nom") ?? "",
            lastName: getTallyFormValueOf(tallyForm, "Prénom") ?? "",
            agencyName:
              getTallyFormValueOf(
                tallyForm,
                "Nom de la structure qui souhaite une convention de délégation",
              ) ?? "",
            agencyProvince:
              getTallyFormValueOf(
                tallyForm,
                "Région de la structure qui souhaite une convention de délégation",
              ) ?? "",
            delegationProviderMail:
              delegationContactEmailByProvince[
                getTallyFormValueOf(
                  tallyForm,
                  "Région de la structure qui souhaite une convention de délégation",
                ) ?? ""
              ],
          },
        },
      ],
    });
  });
});

const wrongTallyForm: TallyForm = {
  eventId: "444e93a8-68db-4cc2-ac17-0bbcbd4460f8",
  eventType: "FORM_RESPONSE",
  createdAt: "2024-04-17T08:56:10.922Z",
  data: {
    responseId: "2O0vAe",
    submissionId: "2O0vAe",
    respondentId: "v2eE1D",
    formId: "w7WM49",
    formName:
      "Recevoir le contact du prescripteur de droit qui peut me délivrer une convention de délégation",
    createdAt: "2024-04-17T08:56:10.000Z",
    fields: [],
  },
};

const tallyForm: TallyForm = {
  eventId: "444e93a8-68db-4cc2-ac17-0bbcbd4460f8",
  eventType: "FORM_RESPONSE",
  createdAt: "2024-04-17T08:56:10.922Z",
  data: {
    responseId: "2O0vAe",
    submissionId: "2O0vAe",
    respondentId: "v2eE1D",
    formId: "w7WM49",
    formName:
      "Recevoir le contact du prescripteur de droit qui peut me délivrer une convention de délégation",
    createdAt: "2024-04-17T08:56:10.000Z",
    fields: [
      {
        key: "question_rDVYj2",
        label: "Nom",
        type: "INPUT_TEXT",
        value: "sdfghjk",
      },
      {
        key: "question_4aLO4A",
        label: "Prénom",
        type: "INPUT_TEXT",
        value: "dfghjk",
      },
      {
        key: "question_jeLzaJ",
        label: "Email",
        type: "INPUT_EMAIL",
        value: "recipient@mail.com",
      },
      {
        key: "question_xV2zXv",
        label: "Nom de la structure qui souhaite une convention de délégation",
        type: "INPUT_TEXT",
        value: "kjhg",
      },
      {
        key: "question_VpY1aa",
        label:
          "Région de la structure qui souhaite une convention de délégation",
        type: "MULTIPLE_CHOICE",
        value: ["98052009-6a3a-44c4-87ee-8bc28b5b7161"],
        options: [
          {
            id: "5263bf8d-0eed-4e3a-9e6b-a41d55f6632e",
            text: "Auvergne-Rhône-Alpes",
          },
          {
            id: "98052009-6a3a-44c4-87ee-8bc28b5b7161",
            text: "Bourgogne-Franche-Comté",
          },
          {
            id: "13174829-5679-413b-952c-aa47dd2c7a29",
            text: "Bretagne",
          },
          {
            id: "bb7b5e75-1930-4cb0-802d-97423f3348e9",
            text: "Centre-Val de Loire",
          },
          {
            id: "04a47353-6c31-465f-8a32-1d6af9bcf2ae",
            text: "Corse",
          },
          {
            id: "88910a41-172a-4429-a94b-9912b1903fa7",
            text: "Grand Est",
          },
          {
            id: "c85462a5-17eb-443f-90c6-47e417f4f12f",
            text: "Guadeloupe",
          },
          {
            id: "ee2a2ee6-82fe-4243-a74d-e1cbbf6a3bba",
            text: "Guyane",
          },
          {
            id: "fcb5d857-9261-4ac1-9eab-72c9bf0ce335",
            text: "Hauts-de-France",
          },
          {
            id: "2bbe93a6-450c-468f-8ba5-f4f670638713",
            text: "Île-de-France",
          },
          {
            id: "1eaa35d4-0d6f-4073-a736-513189ab2831",
            text: "Martinique",
          },
          {
            id: "1eaa35d4-0d6f-4073-a736-513189ab2832",
            text: "Mayotte",
          },
          {
            id: "0db88b69-b04f-4211-aec0-68c9c60412c3",
            text: "Normandie",
          },
          {
            id: "9673d28a-8974-4e1b-adec-fc5dc4dc84d3",
            text: "Nouvelle-Aquitaine",
          },
          {
            id: "fe7fc4b1-3f04-4272-b1e2-5786d83d1ee6",
            text: "Occitanie",
          },
          {
            id: "0eeac1f6-efc5-493c-9354-ce6161c16521",
            text: "Pays de la Loire",
          },
          {
            id: "69d933fb-2c02-4b09-9402-8d4eae94c41f",
            text: "Provence-Alpes-Côte d'Azur",
          },
          {
            id: "7135e2be-3e0d-46c9-beca-280d187fcf15",
            text: "Réunion",
          },
        ],
      },
    ],
  },
};
