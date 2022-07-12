import { z } from "zod";

type IdDto = {
  id: string;
};
export const idSchema: z.Schema<IdDto> = z.object({ id: z.string() });
