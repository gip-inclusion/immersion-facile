import { demandeImmersionDtoSchema } from "../../shared/DemandeImmersionDto";
import { DemandeImmersionEntity } from "../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import {
  validDemandeImmersion,
  VALID_EMAILS,
  DATE_START,
  DATE_END,
} from "../../_testBuilders/DemandeImmersionIdEntityTestData";

describe("DemandeImmersionIdEntity", () => {
  describe("DemandeImmersionIdEntity.create()", () => {
    it("creates a DemandeImmersionIdEntity for valid parameters", () => {
      const entity = DemandeImmersionEntity.create(validDemandeImmersion);
      const dto = entity.toDto();
      expect(dto.email).toEqual(VALID_EMAILS[0]);
      expect(dto.dateStart).toEqual(DATE_START);
      expect(dto.dateEnd).toEqual(DATE_END);
    });

    it("rejects invalid parameters", () => {
      const invalidDemandeImmersion = {
        ...validDemandeImmersion,
        email: "not_a_valid_email",
      };
      expect(() =>
        DemandeImmersionEntity.create(invalidDemandeImmersion)
      ).toThrow();
    });
  });

  describe("DemandeImmersionEntity.toDto()", () => {
    it("converts entities to DTOs", () => {
      const entity = DemandeImmersionEntity.create(validDemandeImmersion);
      expect(entity.toDto()).toEqual(validDemandeImmersion);
    });
  });
});
