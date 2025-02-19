import { Response } from "express";
import {
  AbsoluteUrl,
  FTConnectError,
  ManagedFTConnectError,
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
  (error: ManagedFTConnectError, res: Response): void => {
    res.redirect(`${redirectErrorUrl}?kind=${error.kind}`);
  };

export const makeHandleRawRedirectResponseError =
  (redirectErrorUrl: AbsoluteUrl) => (error: FTConnectError, res: Response) => {
    res.redirect(
      `${redirectErrorUrl}?${queryParamsAsString<RawRedirectErrorParams>(
        toRawRedirectErrorParams(error),
      )}`,
    );
  };
