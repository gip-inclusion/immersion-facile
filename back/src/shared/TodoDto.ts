import * as Yup from "yup";

export const todoDtoSchema = Yup.object({
  uuid: Yup.string().required(),
  description: Yup.string().required(),
}).required();

export type TodoDto = Yup.InferType<typeof todoDtoSchema>;
