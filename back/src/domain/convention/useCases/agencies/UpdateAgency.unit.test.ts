import {
  AgencyDtoBuilder,
  expectObjectsToMatch,
  expectPromiseToFailWith,
  expectToEqual,
} from "shared";
import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import { CustomClock } from "../../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryAgencyRepository } from "../../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";

import { makeCreateNewEvent } from "../../../core/eventBus/EventBus";
import { UpdateAgency } from "./UpdateAgency";

describe("Update agency", () => {
  let agencyRepository: InMemoryAgencyRepository;
  let outboxRepository: InMemoryOutboxRepository;
  let updateAgency: UpdateAgency;

  beforeEach(() => {
    const clock = new CustomClock();
    const uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });
    const uow = createInMemoryUow();
    agencyRepository = uow.agencyRepository;
    outboxRepository = uow.outboxRepository;

    updateAgency = new UpdateAgency(
      new InMemoryUowPerformer(uow),
      createNewEvent,
    );
  });

  it("Fails trying to edit if no matching agency was found", async () => {
    const agency = new AgencyDtoBuilder().build();
    await expectPromiseToFailWith(
      updateAgency.execute(agency),
      `No agency found with id : ${agency.id}`,
    );
  });

  it("Updates agency and create corresponding event", async () => {
    const initialAgencyInRepo = new AgencyDtoBuilder().build();
    agencyRepository.setAgencies([initialAgencyInRepo]);

    const updatedAgency = new AgencyDtoBuilder()
      .withId(initialAgencyInRepo.id)
      .withName("L'agence modifié")
      .withValidatorEmails(["new-validator@mail.com"])
      .build();

    const response = await updateAgency.execute(updatedAgency);
    expect(response).toBeUndefined();
    expectToEqual(agencyRepository.agencies, [updatedAgency]);

    expect(outboxRepository.events).toHaveLength(1);
    expectObjectsToMatch(outboxRepository.events[0], {
      topic: "AgencyUpdated",
      payload: { agency: updatedAgency },
    });
  });
});
