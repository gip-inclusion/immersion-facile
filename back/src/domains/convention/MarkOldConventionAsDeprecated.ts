import type { ZodSchemaWithInputMatchingOutput } from "shared";
import { z } from "zod";
import { useCaseBuilder } from "../core/useCaseBuilder";

const markOldConventionAsDeprecatedSchema: ZodSchemaWithInputMatchingOutput<{
  deprecateSince: Date;
}> = z.object({
  deprecateSince: z.date(),
});

export type MarkOldConventionAsDeprecated = ReturnType<
  typeof makeMarkOldConventionAsDeprecated
>;
export const makeMarkOldConventionAsDeprecated = useCaseBuilder(
  "MarkOldConventionAsDeprecated",
)
  .withInput(markOldConventionAsDeprecatedSchema)
  .build(async ({ uow, inputParams }) => {
    const updatedConventionsIds =
      await uow.conventionRepository.deprecateConventionsWithoutDefinitiveStatusEndedSince(
        inputParams.deprecateSince,
      );
    return {
      numberOfUpdatedConventions: updatedConventionsIds.length,
    };
  });
