import { z } from "zod";
import { AddressDto } from "./address.dto";

export const addressSchema: z.Schema<AddressDto> = z.object({
  streetNumberAndAddress: z.string(),
  postcode: z.string(),
  departmentCode: z.string(),
  city: z.string(),
});
