import { Response } from "express";

export class NotFoundError extends Error {
  constructor(msg: any) {
    super(msg);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export const sendHttpResponse = async (
  res: Response,
  callback: () => Promise<unknown>
) => {
  try {
    const response = await callback();
    res.status(200);
    return res.json(response || { success: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404);
    } else {
      res.status(400);
    }
    return res.json({ errors: error.errors || [error.message] });
  }
};
