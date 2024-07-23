import {
  ConventionDomainPayload,
  ConventionDtoBuilder,
  ConventionId,
  EstablishmentTutor,
  InclusionConnectedUserBuilder,
  conventionStatuses,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { BadRequestError, ForbiddenError } from "shared";
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
import { UpdateConvention } from "./UpdateConvention";

const backofficeAdminUser = new InclusionConnectedUserBuilder()
  .withId("backoffice-admin-user-id")
  .withIsAdmin(true)
  .build();

describe("Update Convention", () => {
  let updateConvention: UpdateConvention;
  let createNewEvent: CreateNewEvent;
  let uowPerformer: InMemoryUowPerformer;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();

    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
      backofficeAdminUser,
    ]);

    createNewEvent = makeCreateNewEvent({
      timeGateway: new CustomTimeGateway(),
      uuidGenerator: new TestUuidGenerator(),
    });

    uowPerformer = new InMemoryUowPerformer(uow);

    updateConvention = new UpdateConvention(uowPerformer, createNewEvent);
  });

  describe("when user is not allowed", () => {
    it("throws without jwtPayload", async () => {
      const convention = new ConventionDtoBuilder().build();
      await expectPromiseToFailWithError(
        updateConvention.execute({
          convention,
        }),
        errors.user.unauthorized(),
      );
    });

    it("throws if inclusion connected user is not admin", async () => {
      const convention = new ConventionDtoBuilder().build();
      const icUser = new InclusionConnectedUserBuilder()
        .withIsAdmin(false)
        .build();

      uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([icUser]);

      await expectPromiseToFailWithError(
        updateConvention.execute({ convention }, { userId: icUser.id }),
        errors.user.notBackOfficeAdmin({ userId: icUser.id }),
      );
    });

    it("throws if no convention id does not match the one in jwt payload", () => {
      const convention = new ConventionDtoBuilder().build();
      const jwtPayload: ConventionDomainPayload = {
        applicationId: "another-convention-id",
        role: "beneficiary",
        emailHash: "yolo",
      };

      expectPromiseToFailWithError(
        updateConvention.execute({ convention }, jwtPayload),
        new ForbiddenError(
          `User is not allowed to update convention ${convention.id}`,
        ),
      );
    });
  });

  describe("When the Convention is valid", () => {
    it("updates the Convention in the repository", async () => {
      const conventionInRepo = new ConventionDtoBuilder().build();
      uow.conventionRepository.setConventions([conventionInRepo]);

      const updatedConvention = new ConventionDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .withBeneficiaryEmail("new@email.fr")
        .withStatusJustification("justif")
        .build();

      const { id } = await updateConvention.execute(
        { convention: updatedConvention },
        { userId: backofficeAdminUser.id },
      );
      expect(id).toEqual(updatedConvention.id);
      expect(uow.conventionRepository.conventions).toEqual([updatedConvention]);
    });
  });

  describe("When no Convention with id exists", () => {
    it("throws NotFoundError", async () => {
      const id = "add5c20e-6dd2-45af-affe-927358005251";
      const validConvention = new ConventionDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .withId(id)
        .withStatusJustification("justif")
        .build();

      await expectPromiseToFailWithError(
        updateConvention.execute(
          { convention: validConvention },
          { userId: backofficeAdminUser.id },
        ),
        errors.convention.notFound({ conventionId: id }),
      );
    });
  });

  describe("When previous state is not draft (testing with READY_TO_SIGN)", () => {
    it("throws Bad request", async () => {
      const storedConvention = new ConventionDtoBuilder()
        .withStatus("PARTIALLY_SIGNED")
        .build();

      uow.conventionRepository.setConventions([storedConvention]);

      //we would expect READY_TO_SIGN to be the most frequent case of previous state that we want to prevent here. Not testing all the possible statuses.
      const updatedConvention = new ConventionDtoBuilder()
        .withId(storedConvention.id)
        .withStatus("READY_TO_SIGN")
        .withStatusJustification("justif")
        .build();

      await expectPromiseToFailWithError(
        updateConvention.execute(
          {
            convention: updatedConvention,
          },
          {
            applicationId: storedConvention.id,
            role: "beneficiary",
            emailHash: "123",
          },
        ),
        new BadRequestError(
          `Convention ${storedConvention.id} cannot be modified as it has status PARTIALLY_SIGNED`,
        ),
      );
    });
  });

  describe("Update cases", () => {
    it("With tutor different of establishment representative", async () => {
      const tutor: EstablishmentTutor = {
        role: "establishment-tutor",
        firstName: "Bob",
        lastName: "Harrys",
        email: "bob.harry@mail.com",
        phone: "+33112233445",
        job: "tutor",
      };
      const storedConvention = new ConventionDtoBuilder()
        .withStatus("DRAFT")
        .withEstablishmentTutor(tutor)
        .withEstablishmentRepresentative({
          ...tutor,
          role: "establishment-representative",
        })
        .build();

      uow.conventionRepository.setConventions([storedConvention]);

      //we would expect READY_TO_SIGN to be the most frequent case of previous state that we want to prevent here. Not testing all the possible statuses.
      const updatedConvention = new ConventionDtoBuilder(storedConvention)
        .withStatus("READY_TO_SIGN")
        .withEstablishmentRepresentative({
          role: "establishment-representative",
          firstName: "Martin",
          lastName: "Hills",
          email: "martin.hills@mail.com",
          phone: "+33112233445",
        })
        .build();

      await updateConvention.execute(
        {
          convention: updatedConvention,
        },
        { userId: backofficeAdminUser.id },
      );
      expect(uow.conventionRepository.conventions).toEqual([updatedConvention]);
    });

    it("With beneficiary current employer", async () => {
      const storedConvention = new ConventionDtoBuilder()
        .withStatus("DRAFT")
        .build();

      uow.conventionRepository.setConventions([storedConvention]);

      //we would expect READY_TO_SIGN to be the most frequent case of previous state that we want to prevent here. Not testing all the possible statuses.
      const updatedConvention = new ConventionDtoBuilder(storedConvention)
        .withStatus("READY_TO_SIGN")
        .withBeneficiaryCurrentEmployer({
          role: "beneficiary-current-employer",
          firstName: "Danny",
          lastName: "Clover",
          email: "danny@mail.com",
          phone: "+33112233445",
          businessName: "business",
          businessSiret: "01234567891234",
          job: "Boss",
          businessAddress: "Rue des Bouchers 67065 Strasbourg",
        })
        .build();

      await updateConvention.execute(
        { convention: updatedConvention },
        { userId: backofficeAdminUser.id },
      );
      expect(uow.conventionRepository.conventions).toEqual([updatedConvention]);
    });
  });

  describe("Status validation", () => {
    let id: ConventionId;
    beforeEach(() => {
      const convention = new ConventionDtoBuilder().build();
      uow.conventionRepository.setConventions([convention]);
      id = convention.id;
    });

    it("allows applications submitted as READY_TO_SIGN", async () => {
      const inReviewConvention = new ConventionDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .withId(id)
        .build();

      expect(
        await updateConvention.execute(
          { convention: inReviewConvention },
          { userId: backofficeAdminUser.id },
        ),
      ).toEqual({
        id: inReviewConvention.id,
      });
    });

    it("rejects applications if the status is not DRAFT or READY_TO_SIGN", async () => {
      for (const status of conventionStatuses) {
        // eslint-disable-next-line jest/no-if
        if (status === "DRAFT" || status === "READY_TO_SIGN") {
          continue;
        }
        const convention = new ConventionDtoBuilder()
          .withStatus(status)
          .withId(id)
          .build();

        await expectPromiseToFailWithError(
          updateConvention.execute(
            { convention },
            { userId: backofficeAdminUser.id },
          ),
          new ForbiddenError(
            `Convention ${convention.id} with modifications should have status READY_TO_SIGN`,
          ),
        );
      }
    });

    it("should emit ConventionSubmittedAfterModification event when successful", async () => {
      const inReviewConvention = new ConventionDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .withId(id)
        .withStatusJustification("updateJustification")
        .build();

      const response = await updateConvention.execute(
        { convention: inReviewConvention },
        { userId: backofficeAdminUser.id },
      );

      expect(uow.outboxRepository.events).toHaveLength(1);
      expectToEqual(
        uow.outboxRepository.events[0],
        createNewEvent({
          topic: "ConventionSubmittedAfterModification",
          payload: {
            convention: inReviewConvention,
            triggeredBy: {
              kind: "inclusion-connected",
              userId: backofficeAdminUser.id,
            },
          },
        }),
      );

      expectToEqual(response, {
        id: inReviewConvention.id,
      });
    });

    it("should throw forbidden Error if provided convention has status DRAFT", async () => {
      const draftConvention = new ConventionDtoBuilder()
        .withStatus("DRAFT")
        .withId(id)
        .build();

      await expectPromiseToFailWithError(
        updateConvention.execute(
          { convention: draftConvention },
          { userId: backofficeAdminUser.id },
        ),
        new ForbiddenError(
          `Convention ${id} with modifications should have status READY_TO_SIGN`,
        ),
      );
    });
  });
});
