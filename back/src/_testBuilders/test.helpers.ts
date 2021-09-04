import { addDays as dateFnsAddDays, format } from "date-fns";

export const expectPromiseToFailWith = async (
  promise: Promise<unknown>,
  errorMessage: string
) => {
  await expect(promise).rejects.toThrowError(new Error(errorMessage));
};

export const expectPromiseToFailWithError = async (
  promise: Promise<unknown>,
  error: Error
) => {
  await expect(promise).rejects.toThrowError(error);
};

export const addDays = (dateStr: string, amount: number) => {
  const newDate = dateFnsAddDays(new Date(dateStr), amount);
  return format(newDate, "yyyy-MM-dd");
};
