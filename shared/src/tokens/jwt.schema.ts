import { z } from "zod";
import { JwtDto } from "..";

export const jwtSchema: z.Schema<JwtDto> = z.object({ jwt: z.string() });
