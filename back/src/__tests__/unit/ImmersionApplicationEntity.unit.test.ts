import { ImmersionApplicationEntityBuilder } from "../../_testBuilders/ImmersionApplicationEntityBuilder";
import { ImmersionApplicationEntity } from "../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import {
  VALID_EMAILS,
  DATE_START,
  DATE_END,
  ImmersionApplicationDtoBuilder,
} from "../../_testBuilders/ImmersionApplicationDtoBuilder";
import { ImmersionApplicationDto } from "../../shared/ImmersionApplicationDto";

describe("ImmersionApplicationIdEntity", () => {
  describe("ImmersionApplicationIdEntity.create()", () => {
    it("creates a ImmersionApplicationIdEntity for valid parameters", () => {
      const entity = new ImmersionApplicationEntityBuilder().build();
      const dto = entity.toDto();
      expect(dto.email).toEqual(VALID_EMAILS[0]);
      expect(dto.dateStart).toEqual(DATE_START);
      expect(dto.dateEnd).toEqual(DATE_END);
    });

    it("rejects invalid parameters", () => {
      const invalidDemandeImmersion = new ImmersionApplicationDtoBuilder()
        .withEmail("not_a_valid_email")
        .build();

      expectDemandeImmersionEntityToBeInvalidWithParams(
        invalidDemandeImmersion,
      );
    });
  });

  describe("DemandeImmersionEntity.toDto()", () => {
    it("converts entities to DTOs", () => {
      const demandeImmersion = new ImmersionApplicationDtoBuilder().build();
      const entity = ImmersionApplicationEntity.create(demandeImmersion);
      expect(entity.toDto()).toEqual(demandeImmersion);
    });
  });
});

const expectDemandeImmersionEntityToBeInvalidWithParams = (
  demandeImmersionDto: ImmersionApplicationDto,
) =>
  expect(() =>
    ImmersionApplicationEntity.create(demandeImmersionDto),
  ).toThrow();
