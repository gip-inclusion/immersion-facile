import { z } from "zod";
import { AddressAndPosition } from "../apiAdresse/AddressAPI";
import { geoPositionSchema } from "../geoPosition/geoPosition.schema";
import { AddressDto } from "./address.dto";

export const addressSchema: z.Schema<AddressDto> = z.object({
  streetNumberAndAddress: z.string(),
  postcode: z.string(),
  departmentCode: z.string(),
  city: z.string(),
});

export const addressAndPositionSchema: z.Schema<AddressAndPosition> = z.object({
  address: addressSchema,
  position: geoPositionSchema,
});

export const addressAndPositionListSchema: z.ZodSchema<AddressAndPosition[]> =
  z.array(addressAndPositionSchema);
