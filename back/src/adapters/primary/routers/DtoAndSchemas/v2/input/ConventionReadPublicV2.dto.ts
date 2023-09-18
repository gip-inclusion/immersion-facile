import { ConventionReadDto } from "shared";

export type ConventionReadPublicV2Dto = ConventionReadDto;

export const conventionReadToConventionReadPublicV2 = (
  conventionReadDto: ConventionReadDto,
): ConventionReadPublicV2Dto => conventionReadDto;
