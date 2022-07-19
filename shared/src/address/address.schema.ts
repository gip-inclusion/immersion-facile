import { z } from "zod";
import { AddressDto } from "./address.dto";

export const addressSchema: z.Schema<AddressDto> = z.object({
  streetNumberAndAddress: z.string(),
  postCode: z.string(),
  countyCode: z.string(),
  city: z.string(),
});
