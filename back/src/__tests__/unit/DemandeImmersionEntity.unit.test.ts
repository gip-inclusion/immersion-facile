import { DemandeImmersionEntityBuilder } from "../../_testBuilders/DemandeImmersionEntityBuilder";
import { DemandeImmersionEntity } from "../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import {
  VALID_EMAILS,
  DATE_START,
  DATE_END,
  DemandeImmersionDtoBuilder,
} from "../../_testBuilders/DemandeImmersionDtoBuilder";
import { DemandeImmersionDto } from "../../shared/DemandeImmersionDto";

describe("DemandeImmersionIdEntity", () => {
  describe("DemandeImmersionIdEntity.create()", () => {
    it("creates a DemandeImmersionIdEntity for valid parameters", () => {
      const entity = new DemandeImmersionEntityBuilder().build();
      const dto = entity.toDto();
      expect(dto.email).toEqual(VALID_EMAILS[0]);
      expect(dto.dateStart).toEqual(DATE_START);
      expect(dto.dateEnd).toEqual(DATE_END);
    });

    it("rejects invalid parameters", () => {
      const invalidDemandeImmersion = new DemandeImmersionDtoBuilder()
        .withEmail("not_a_valid_email")
        .build();

      expectDemandeImmersionEntityToBeInvalidWithParams(
        invalidDemandeImmersion,
      );
    });
  });

  describe("DemandeImmersionEntity.toDto()", () => {
    it("converts entities to DTOs", () => {
      const demandeImmersion = new DemandeImmersionDtoBuilder().build();
      const entity = DemandeImmersionEntity.create(demandeImmersion);
      expect(entity.toDto()).toEqual(demandeImmersion);
    });
  });
});

const expectDemandeImmersionEntityToBeInvalidWithParams = (
  demandeImmersionDto: DemandeImmersionDto,
) => expect(() => DemandeImmersionEntity.create(demandeImmersionDto)).toThrow();
