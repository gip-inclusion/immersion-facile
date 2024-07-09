import {
  AgencyDtoBuilder,
  InclusionConnectedUserBuilder,
  errorMessages,
  expectObjectsToMatch,
  expectPromiseToFail,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../../../config/helpers/httpErrors";
import { InMemoryOutboxRepository } from "../../core/events/adapters/InMemoryOutboxRepository";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { InMemoryAgencyRepository } from "../adapters/InMemoryAgencyRepository";
import { UpdateAgency } from "./UpdateAgency";

const backofficeAdmin = new InclusionConnectedUserBuilder()
  .withId("backoffice-admin-id")
  .withIsAdmin(true)
  .build();

const icUser = new InclusionConnectedUserBuilder()
  .withId("not-admin-id")
  .withIsAdmin(false)
  .build();

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

    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
      backofficeAdmin,
      icUser,
    ]);

    updateAgency = new UpdateAgency(
      new InMemoryUowPerformer(uow),
      createNewEvent,
    );
  });

  it("throws Unauthorized if no current user", async () => {
    const agency = new AgencyDtoBuilder().build();
    await expectPromiseToFailWithError(
      updateAgency.execute(agency),
      new UnauthorizedError(),
    );
  });

  it("throws Forbidden if current user is not admin", async () => {
    const agency = new AgencyDtoBuilder().build();
    await expectPromiseToFailWithError(
      updateAgency.execute(agency, icUser),
      new ForbiddenError(errorMessages.user.forbidden({ userId: icUser.id })),
    );
  });

  it("Fails trying to update if no matching agency was found", async () => {
    const agency = new AgencyDtoBuilder().build();
    await expectPromiseToFailWithError(
      updateAgency.execute(agency, backofficeAdmin),
      new NotFoundError(errorMessages.agency.notFound({ agencyId: agency.id })),
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
      updateAgency.execute(updatedAgency, backofficeAdmin),
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
      updateAgency.execute(updatedAgency, backofficeAdmin),
      new BadRequestError(expectedErrorMessage),
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

    const response = await updateAgency.execute(updatedAgency, backofficeAdmin);
    expect(response).toBeUndefined();
    expectToEqual(agencyRepository.agencies, [updatedAgency]);

    expect(outboxRepository.events).toHaveLength(1);
    expectObjectsToMatch(outboxRepository.events[0], {
      topic: "AgencyUpdated",
      payload: {
        agency: updatedAgency,
        triggeredBy: {
          kind: "inclusion-connected",
          userId: backofficeAdmin.id,
        },
      },
    });
  });
});
