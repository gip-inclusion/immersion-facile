import { AgencyDtoBuilder, expectToEqual } from "shared";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { UpdateAgencyReferingToUpdatedAgency } from "./UpdateAgencyReferingToUpdatedAgency";

describe("UpdateAgencyReferingToUpdatedAgency", () => {
  const updatedAgency = new AgencyDtoBuilder()
    .withId("1")
    .withValidatorEmails(["update@mail.com"])
    .build();
  const agencyRefersToUpdatedAgency1 = new AgencyDtoBuilder()
    .withId("2")
    .withValidatorEmails(["not.updated@mail.com"])
    .withRefersToAgencyId(updatedAgency.id)
    .build();
  const agencyRefersToUpdatedAgency2 = new AgencyDtoBuilder()
    .withId("3")
    .withValidatorEmails(["not.updated@mail.com"])
    .withRefersToAgencyId(updatedAgency.id)
    .build();
  const agencyNotReferingToUpdatedAgency = new AgencyDtoBuilder()
    .withId("4")
    .withValidatorEmails(["not.updated@mail.com"])
    .build();

  let uow: InMemoryUnitOfWork;
  let usecase: UpdateAgencyReferingToUpdatedAgency;
  let createNewEvent: CreateNewEvent;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    uow = createInMemoryUow();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({
      timeGateway: new CustomTimeGateway(),
      uuidGenerator,
    });
    usecase = new UpdateAgencyReferingToUpdatedAgency(
      new InMemoryUowPerformer(uow),
      createNewEvent,
    );
  });

  describe("right paths", () => {
    it("update agencies validator emails that refers to updated agency", async () => {
      uuidGenerator.setNextUuids(["event1", "event2"]);
      uow.agencyRepository.setAgencies([
        updatedAgency,
        agencyRefersToUpdatedAgency1,
        agencyRefersToUpdatedAgency2,
      ]);

      await usecase.execute({ agency: updatedAgency });

      expectToEqual(uow.agencyRepository.agencies, [
        updatedAgency,
        {
          ...agencyRefersToUpdatedAgency1,
          validatorEmails: updatedAgency.validatorEmails,
        },
        {
          ...agencyRefersToUpdatedAgency2,
          validatorEmails: updatedAgency.validatorEmails,
        },
      ]);

      expectToEqual(uow.outboxRepository.events, [
        {
          ...createNewEvent({
            topic: "AgencyUpdated",
            payload: {
              agency: {
                ...agencyRefersToUpdatedAgency1,
                validatorEmails: updatedAgency.validatorEmails,
              },
            },
          }),
          id: "event1",
        },
        {
          ...createNewEvent({
            topic: "AgencyUpdated",
            payload: {
              agency: {
                ...agencyRefersToUpdatedAgency2,
                validatorEmails: updatedAgency.validatorEmails,
              },
            },
          }),
          id: "event2",
        },
      ]);
    });

    it("do nothing when there no related agencies that refers to updated agency", async () => {
      uow.agencyRepository.setAgencies([
        updatedAgency,
        agencyNotReferingToUpdatedAgency,
      ]);

      await usecase.execute({ agency: updatedAgency });

      expectToEqual(uow.agencyRepository.agencies, [
        updatedAgency,
        agencyNotReferingToUpdatedAgency,
      ]);
      expectToEqual(uow.outboxRepository.events, []);
    });
  });
});
