import { zStringMinLength1 } from "../utils/string.schema";

const sanitize = (text: string) => text.replace(/[^a-zA-ZÀ-ÿ-]/g, " ").trim();

export const searchTextSchema = zStringMinLength1.transform(sanitize);
