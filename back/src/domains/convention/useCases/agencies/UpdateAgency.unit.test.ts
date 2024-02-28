import {
  AgencyDtoBuilder,
  BackOfficeJwtPayload,
  expectObjectsToMatch,
  expectPromiseToFail,
  expectPromiseToFailWith,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../../../../adapters/primary/helpers/httpErrors";
import { InMemoryAgencyRepository } from "../../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryOutboxRepository } from "../../../core/events/adapters/InMemoryOutboxRepository";
import { makeCreateNewEvent } from "../../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { UpdateAgency } from "./UpdateAgency";

const backofficeJwtPayload: BackOfficeJwtPayload = {
  role: "backOffice",
  iat: 0,
  exp: 0,
  sub: "backoffice-id",
  version: 1,
};

describe("Update agency", () => {
  const initialAgencyInRepo = new AgencyDtoBuilder().build();

  let agencyRepository: InMemoryAgencyRepository;
  let outboxRepository: InMemoryOutboxRepository;
  let updateAgency: UpdateAgency;

  beforeEach(() => {
    const timeGateway = new CustomTimeGateway();
    const uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({
      timeGateway,
      uuidGenerator,
    });
    const uow = createInMemoryUow();
    agencyRepository = uow.agencyRepository;
    outboxRepository = uow.outboxRepository;

    updateAgency = new UpdateAgency(
      new InMemoryUowPerformer(uow),
      createNewEvent,
    );
  });

  it("throws Unauthorized if no jwtPayload provided", async () => {
    const agency = new AgencyDtoBuilder().build();
    await expectPromiseToFailWithError(
      updateAgency.execute(agency),
      new UnauthorizedError(),
    );
  });

  it("Fails trying to update if no matching agency was found", async () => {
    const agency = new AgencyDtoBuilder().build();
    await expectPromiseToFailWith(
      updateAgency.execute(agency, backofficeJwtPayload),
      `No agency found with id : ${agency.id}`,
    );
  });

  it("Fails to update agency if address components are empty", async () => {
    agencyRepository.setAgencies([initialAgencyInRepo]);
    const updatedAgency = new AgencyDtoBuilder()
      .withId(initialAgencyInRepo.id)
      .withName("L'agence modifié")
      .withValidatorEmails(["new-validator@mail.com"])
      .withAddress({
        streetNumberAndAddress: "",
        postcode: "",
        city: "",
        departmentCode: "",
      })
      .build();
    await expectPromiseToFail(
      updateAgency.execute(updatedAgency, backofficeJwtPayload),
    );
  });

  it("Fails to update agency if geo components are 0,0", async () => {
    const initialAgencyInRepo = new AgencyDtoBuilder().build();
    agencyRepository.setAgencies([initialAgencyInRepo]);
    const updatedAgency = new AgencyDtoBuilder()
      .withId(initialAgencyInRepo.id)
      .withName("L'agence modifié")
      .withValidatorEmails(["new-validator@mail.com"])
      .withPosition(0, 0)
      .build();

    const expectedErrorMessage = JSON.stringify(
      [
        {
          code: "custom",
          message: "0 est une latitude par défaut qui ne semble pas correcte",
          path: ["position", "lat"],
        },
        {
          code: "custom",
          message: "0 est une longitude par défaut qui ne semble pas correcte",
          path: ["position", "lon"],
        },
      ],
      null,
      2,
    );

    await expectPromiseToFailWithError(
      updateAgency.execute(updatedAgency, backofficeJwtPayload),
      new BadRequestError(expectedErrorMessage),
    );
  });

  it("fails to update if attempt to update to another existing agency (with same address and kind, and a status 'active' or 'from-api-PE'", async () => {
    const existingAgency = new AgencyDtoBuilder().build();
    const updatedAgency = new AgencyDtoBuilder()
      .withId("agency-to-update-id")
      .withStatus("needsReview")
      .withAddress(existingAgency.address)
      .withKind(existingAgency.kind)
      .build();

    agencyRepository.setAgencies([updatedAgency, existingAgency]);

    // conflict error when user is not admin
    await expectPromiseToFailWithError(
      updateAgency.execute(updatedAgency, { role: "another-role" } as any),
      new ConflictError(
        "Une autre agence du même type existe avec la même adresse",
      ),
    );

    // no conflict error if user is admin
    const result = await updateAgency.execute(
      updatedAgency,
      backofficeJwtPayload,
    );
    expect(result).toBeUndefined();
  });

  it("Updates agency and create corresponding event", async () => {
    const initialAgencyInRepo = new AgencyDtoBuilder().build();
    agencyRepository.setAgencies([initialAgencyInRepo]);

    const updatedAgency = new AgencyDtoBuilder()
      .withId(initialAgencyInRepo.id)
      .withName("L'agence modifié")
      .withValidatorEmails(["new-validator@mail.com"])
      .build();

    const response = await updateAgency.execute(
      updatedAgency,
      backofficeJwtPayload,
    );
    expect(response).toBeUndefined();
    expectToEqual(agencyRepository.agencies, [updatedAgency]);

    expect(outboxRepository.events).toHaveLength(1);
    expectObjectsToMatch(outboxRepository.events[0], {
      topic: "AgencyUpdated",
      payload: { agency: updatedAgency },
    });
  });
});
