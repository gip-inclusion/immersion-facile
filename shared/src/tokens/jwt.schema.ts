import { z } from "zod";

type JwtDto = {
  jwt: string;
};
export const jwtSchema: z.Schema<JwtDto> = z.object({ jwt: z.string() });
