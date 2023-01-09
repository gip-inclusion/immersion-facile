import { z } from "zod";
import { geoPositionSchema } from "../geoPosition/geoPosition.schema";
import { zString } from "../zodUtils";
import { AddressAndPosition, AddressDto, DepartmentCode } from "./address.dto";

export const departmentCodeSchema: z.Schema<DepartmentCode> = z.string();

export const addressSchema: z.Schema<AddressDto> = z.object({
  streetNumberAndAddress: zString,
  postcode: zString,
  departmentCode: zString,
  city: zString,
});

export const addressAndPositionSchema: z.Schema<AddressAndPosition> = z.object({
  address: addressSchema,
  position: geoPositionSchema,
});

export const addressAndPositionListSchema: z.ZodSchema<AddressAndPosition[]> =
  z.array(addressAndPositionSchema);
