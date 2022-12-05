import { contents404 } from "./404";
import { HTTPFrontErrorContents, HTTPFrontErrorType } from "./types";

const contentsMapper: Record<HTTPFrontErrorType, HTTPFrontErrorContents> = {
  "404": contents404,
};

export const getErrorPageContents = (errorType: HTTPFrontErrorType) =>
  contentsMapper[errorType];
