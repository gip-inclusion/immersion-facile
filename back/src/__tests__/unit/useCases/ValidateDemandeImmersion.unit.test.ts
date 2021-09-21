import { BadRequestError } from "./../../../adapters/primary/helpers/sendHttpResponse";
import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  DemandesImmersion,
  InMemoryDemandeImmersionRepository,
} from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { DemandeImmersionEntity } from "../../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import { ValidateDemandeImmersion } from "../../../domain/demandeImmersion/useCases/ValidateDemandeImmersion";
import { DemandeImmersionDtoBuilder } from "../../../_testBuilders/DemandeImmersionDtoBuilder";
import { DemandeImmersionEntityBuilder } from "../../../_testBuilders/DemandeImmersionEntityBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";

describe("Validate demandeImmersion", () => {
  let validateDemandeImmersion: ValidateDemandeImmersion;
  let repository: InMemoryDemandeImmersionRepository;

  beforeEach(() => {
    repository = new InMemoryDemandeImmersionRepository();
  });

  const createValidateDemandeImmersionUseCase = () => {
    return new ValidateDemandeImmersion({
      demandeImmersionRepository: repository,
    });
  };

  beforeEach(() => {
    validateDemandeImmersion = createValidateDemandeImmersionUseCase();
  });

  describe("When the demandeImmersion is valid", () => {
    test("validates the demandeImmersion in the repository", async () => {
      const demandesImmersion: DemandesImmersion = {};
      const demandeImmersionEntity = DemandeImmersionEntity.create(
        new DemandeImmersionDtoBuilder().withStatus("IN_REVIEW").build()
      );
      demandesImmersion[demandeImmersionEntity.id] = demandeImmersionEntity;
      repository.setDemandesImmersion(demandesImmersion);

      const { id } = await validateDemandeImmersion.execute(
        demandeImmersionEntity.id
      );

      expect(id).toEqual(demandeImmersionEntity.id);

      const storedInRepo = await repository.getAll();
      expect(storedInRepo.map((entity) => entity.toDto())).toEqual([
        { ...demandeImmersionEntity.toDto(), status: "VALIDATED" },
      ]);
    });
  });

  describe("When the demandeImmersion is still draft", () => {
    test("throws bad request error", async () => {
      const demandesImmersion: DemandesImmersion = {};
      const demandeImmersionEntity =
        new DemandeImmersionEntityBuilder().build();
      demandesImmersion[demandeImmersionEntity.id] = demandeImmersionEntity;
      repository.setDemandesImmersion(demandesImmersion);

      await expectPromiseToFailWithError(
        validateDemandeImmersion.execute(demandeImmersionEntity.id),
        new BadRequestError(demandeImmersionEntity.id)
      );

      // And the demande is still DRAFT
      const storedInRepo = await repository.getAll();
      expect(storedInRepo.map((entity) => entity.toDto())).toEqual([
        demandeImmersionEntity.toDto(),
      ]);
    });
  });

  describe("When no demandeImmersion with id exists", () => {
    it("throws NotFoundError", async () => {
      await expectPromiseToFailWithError(
        validateDemandeImmersion.execute("unknown_demande_immersion_id"),
        new NotFoundError("unknown_demande_immersion_id")
      );
    });
  });
});
