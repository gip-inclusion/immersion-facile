import { Request, Response } from "express";
import { deleteFileAndParentFolder } from "../../../utils/filesystemUtils";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export const sendZipResponse = async (
  expressRequest: Request,
  expressResponse: Response,
  callback: () => Promise<string>,
) => {
  try {
    const archivePath = await callback();

    expressResponse.status(200);
    expressResponse.setHeader("content-type", "application/zip");
    return expressResponse.download(archivePath, (err?: Error) => {
      if (err) notifyObjectDiscord(err);
      deleteFileAndParentFolder(archivePath);
    });
  } catch (error: any) {
    handleZipResponseError(expressRequest, expressResponse, error);
  }
};

// TODO Specify better after first logs
const handleZipResponseError = (
  req: Request,
  res: Response,
  error: any,
): Response<any, Record<string, any>> => {
  const stack = JSON.stringify(error.stack, null, 2);
  logger.error(
    {
      error,
      errorMessage: error.message,
      stack,
      request: {
        path: req.path,
        method: req.method,
        body: req.body,
      },
    },
    "ZipResponseError",
  );

  notifyObjectDiscord({
    _message: `ZipResponseError : ${error.message}`,
    routePath: req.path,
    routeMethod: req.method,
    stack,
  });

  res.status(500);

  return res.json({ errors: toValidJSONObjectOrString(error) });
};

const toValidJSONObjectOrString = (
  error: any,
): string | { [key: string]: string } => {
  try {
    return JSON.parse(error.message);
  } catch (_) {
    return error.message;
  }
};
