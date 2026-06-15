import type { Response } from "express";
import {
  type AbsoluteUrl,
  type FTConnectError,
  queryParamsAsString,
} from "shared";

type RawRedirectErrorParams = {
  title: string;
  message: string;
};

const toRawRedirectErrorParams = (
  error: FTConnectError,
): RawRedirectErrorParams => ({
  title: error.title,
  message: error.message,
});

export const makeHandleManagedRedirectResponseError =
  (redirectErrorUrl: AbsoluteUrl) =>
  (res: Response): void => {
    res.redirect(redirectErrorUrl);
  };

export const makeHandleRawRedirectResponseError =
  (redirectErrorUrl: AbsoluteUrl) => (error: FTConnectError, res: Response) => {
    res.redirect(
      `${redirectErrorUrl}?${queryParamsAsString<RawRedirectErrorParams>(
        toRawRedirectErrorParams(error),
      )}`,
    );
  };
