import type { NextFunction, Request, Response } from "express";
import { doesObjectContainsHTML, technicalRoutes } from "shared";

const excludedRoutes: string[] = [
  technicalRoutes.htmlToPdf.url,
  technicalRoutes.inboundEmailParsing.url,
];

export const detectHtmlInParamsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!excludedRoutes.includes(req.originalUrl)) {
    if (
      (req.body && doesObjectContainsHTML(req.body)) ||
      (req.query && doesObjectContainsHTML(req.query))
    ) {
      return res.status(400).json({
        status: 400,
        message: "Invalid request body",
      });
    }
  }
  next();
};
