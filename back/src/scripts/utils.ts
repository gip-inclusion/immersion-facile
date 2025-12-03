import type { DateRange } from "shared";
import { useCaseBuilder } from "../domains/core/useCaseBuilder";

export const getDateRangeFromScriptParams = ({
  scriptParams,
}: {
  scriptParams: string[];
}): DateRange | null => {
  const args = scriptParams.slice(2);
  const from = new Date(args[0]);
  const to = new Date(args[1]);

  if (!args[0] || !args[1]) return null;

  return {
    from,
    to,
  };
};

export const monitoredAsUseCase = <T extends () => Promise<unknown>>(params: {
  name: string;
  cb: T;
}): T => {
  const useCase = useCaseBuilder(params.name)
    .notTransactional()
    .build(params.cb as any)({});
  return (() => useCase.execute()) as T;
};
