import { DemandeImmersionEntity } from "src/domain/demandeImmersion/entities/DemandeImmersionEntity";
import {
  DATE_END,
  DATE_START,
  VALID_EMAILS,
  validDemandeImmersion,
} from "src/domain/demandeImmersion/entities/DemandeImmersionIdEntityTestData";

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
