import { z } from "zod";
import { LookupAddress } from "./address.dto";

export const lookupAddressSchema: z.Schema<LookupAddress> = z.string();
