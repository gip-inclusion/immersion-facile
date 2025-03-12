import type { NumberEmployeesRange } from "shared";

export const getNumberEmployeesRangeByTefenCode = (
  tefenCode?: string,
): NumberEmployeesRange =>
  tefenCode && isTefenCode(tefenCode)
    ? employeeRangeByTefenCode[tefenCode]
    : "";

const isTefenCode = (numberEmployees: string): numberEmployees is TefenCode =>
  numberEmployees in employeeRangeByTefenCode;

// tefenCode is a French standard code for the number of employees in a company.
type TefenCode =
  | "NN"
  | "00"
  | "01"
  | "02"
  | "03"
  | "11"
  | "12"
  | "21"
  | "22"
  | "31"
  | "32"
  | "41"
  | "42"
  | "51"
  | "52"
  | "53";

const employeeRangeByTefenCode: Record<TefenCode, NumberEmployeesRange> = {
  NN: "",
  "00": "0",
  "01": "1-2",
  "02": "3-5",
  "03": "6-9",
  "11": "10-19",
  "12": "20-49",
  "21": "50-99",
  "22": "100-199",
  "31": "200-249",
  "32": "250-499",
  "41": "500-999",
  "42": "1000-1999",
  "51": "2000-4999",
  "52": "5000-9999",
  "53": "+10000",
};
