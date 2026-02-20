import { makeHardenedStringSchema } from "./string.schema";

export const zUuidLike = makeHardenedStringSchema({ max: 36 });
