import { z } from "zod";
import { searchImmersionRequestSchema } from "./SearchImmersionRequest.schema";

export type SearchImmersionRequestDto = z.infer<
  typeof searchImmersionRequestSchema
>;
