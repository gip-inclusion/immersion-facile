import {
  TallyForm,
  errors,
  expectPromiseToFailWithError,
  getTallyFormValueOf,
} from "shared";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { NotifyAgencyDelegationContact } from "./NotifyAgencyDelegationContact";

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
      errors.delegation.missingLabel({
        label:
          "Région de la structure qui souhaite une convention de délégation",
      }),
    );
  });

  it("send an email to agency", async () => {
    const delegationContactEmail = "delegation-contact@email.fr";
    uow.delegationContactRepository.delegationContacts = [
      { province: tallyFormProvince, email: delegationContactEmail },
    ];
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
            agencyProvince: tallyFormProvince,
            delegationProviderMail: delegationContactEmail,
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

const tallyFormProvince = "Bourgogne-Franche-Comté";
const tallyForm: TallyForm = {
  eventId: "444e93a8-68db-4cc2-ac17-0bbcbd4460f8",
  eventType: "FORM_SUBMISSION",
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
            text: tallyFormProvince,
          },
        ],
      },
    ],
  },
};
