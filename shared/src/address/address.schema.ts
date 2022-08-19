import { z } from "zod";
import { geoPositionSchema } from "../geoPosition/geoPosition.schema";
import { AddressAndPosition, AddressDto, DepartmentCode } from "./address.dto";

export const departmentCodeSchema: z.Schema<DepartmentCode> = z.string();

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
