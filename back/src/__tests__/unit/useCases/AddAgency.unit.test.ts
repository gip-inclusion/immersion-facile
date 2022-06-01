import {
  expectObjectsToMatch,
  expectTypeToMatchAndEqual,
} from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import {
  AddAgency,
  defaultQuestionnaireUrl,
} from "../../../domain/immersionApplication/useCases/AddAgency";
import { CreateAgencyConfig } from "shared/src/agency/agency.dto";

const defaultAdminEmail = "myAdmin@mail.com";

const parisMissionLocaleParams: CreateAgencyConfig = {
  id: "some-id",
  address: "paris",
  counsellorEmails: ["counsellor@mail.com"],
  validatorEmails: ["validator@mail.com"],
  kind: "mission-locale",
  name: "Mission locale de Paris",
  position: { lat: 10, lon: 20 },
  questionnaireUrl: "www.myUrl.com",
  signature: "Super signature of the agency",
  logoUrl: "https://www.myUrl.com",
};

describe("AddAgency use case", () => {
  let outboxRepo: InMemoryOutboxRepository;
  let agencyRepo: InMemoryAgencyRepository;
  let uowPerformer: InMemoryUowPerformer;
  let addAgency: AddAgency;

  beforeEach(() => {
    outboxRepo = new InMemoryOutboxRepository();
    agencyRepo = new InMemoryAgencyRepository();
    uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      outboxRepo,
      agencyRepo,
    });
    const clock = new CustomClock();
    const uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

    addAgency = new AddAgency(uowPerformer, createNewEvent, defaultAdminEmail);
  });

  it("save the agency in repo, with the default admin mail and the status to be reviewed", async () => {
    agencyRepo.setAgencies([]);
    await addAgency.execute(parisMissionLocaleParams);
    expectTypeToMatchAndEqual(agencyRepo.agencies, [
      {
        ...parisMissionLocaleParams,
        questionnaireUrl: parisMissionLocaleParams.questionnaireUrl!,
        adminEmails: [defaultAdminEmail],
        status: "needsReview",
      },
    ]);
  });

  it("sets an events to be dispatched with the added agency", async () => {
    await addAgency.execute(parisMissionLocaleParams);
    expect(outboxRepo.events).toHaveLength(1);
    expectObjectsToMatch(outboxRepo.events[0], {
      topic: "NewAgencyAdded",
      payload: {
        ...parisMissionLocaleParams,
        questionnaireUrl: parisMissionLocaleParams.questionnaireUrl!,
        adminEmails: [defaultAdminEmail],
        status: "needsReview",
      },
    });
  });

  it("uses default questionnaire url when none is provided", async () => {
    const poleEmploiParis: CreateAgencyConfig = {
      ...parisMissionLocaleParams,
      questionnaireUrl: "",
    };

    agencyRepo.setAgencies([]);
    await addAgency.execute(poleEmploiParis);

    expectTypeToMatchAndEqual(agencyRepo.agencies, [
      {
        ...poleEmploiParis,
        adminEmails: [defaultAdminEmail],
        status: "needsReview",
        questionnaireUrl: defaultQuestionnaireUrl,
      },
    ]);
  });
});
