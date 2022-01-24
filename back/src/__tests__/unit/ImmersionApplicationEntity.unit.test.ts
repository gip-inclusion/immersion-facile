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
      const invalidImmersionApplication = new ImmersionApplicationDtoBuilder()
        .withEmail("not_a_valid_email")
        .build();

      expectImmersionApplicationEntityToBeInvalidWithParams(
        invalidImmersionApplication,
      );
    });
  });

  describe("ImmersionApplicationEntity.toDto()", () => {
    it("converts entities to DTOs", () => {
      const immersionApplication = new ImmersionApplicationDtoBuilder().build();
      const entity = ImmersionApplicationEntity.create(immersionApplication);
      expect(entity.toDto()).toEqual(immersionApplication);
    });
  });
});

const expectImmersionApplicationEntityToBeInvalidWithParams = (
  immersionApplicationDto: ImmersionApplicationDto,
) =>
  expect(() =>
    ImmersionApplicationEntity.create(immersionApplicationDto),
  ).toThrow();
