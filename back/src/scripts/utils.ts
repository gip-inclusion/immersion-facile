import { DateRange } from "shared";

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
