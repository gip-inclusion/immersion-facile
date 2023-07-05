import { Response } from "express";
import {
  AbsoluteUrl,
  ManagedRedirectError,
  queryParamsAsString,
  RawRedirectError,
} from "shared";

type RawRedirectErrorParams = {
  title: string;
  message: string;
};

const toRawRedirectErrorParams = (
  error: RawRedirectError,
): RawRedirectErrorParams => ({
  title: error.title,
  message: error.message,
});

export const makeHandleManagedRedirectResponseError =
  (redirectErrorUrl: AbsoluteUrl) =>
  (error: ManagedRedirectError, res: Response): void => {
    res.redirect(`${redirectErrorUrl}?kind=${error.kind}`);
  };

export const makeHandleRawRedirectResponseError =
  (redirectErrorUrl: AbsoluteUrl) =>
  (error: RawRedirectError, res: Response) => {
    res.redirect(
      `${redirectErrorUrl}?${queryParamsAsString<RawRedirectErrorParams>(
        toRawRedirectErrorParams(error),
      )}`,
    );
  };
