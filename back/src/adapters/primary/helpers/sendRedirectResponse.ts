import { Request, Response } from "express";

import { AbsoluteUrl } from "shared";

export const sendRedirectResponse = async (
  _req: Request,
  res: Response,
  redirectUrlCallback: () => Promise<AbsoluteUrl>,
) => res.status(302).redirect(await redirectUrlCallback());
