import { zStringMinLength1 } from "../zodUtils";

const sanitize = (text: string) => text.replace(/[^a-zA-ZÀ-ÿ\-]/g, " ").trim();

export const searchTextSchema = zStringMinLength1.transform(sanitize);
