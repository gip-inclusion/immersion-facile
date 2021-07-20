import { Response } from "express";

export const sendHttpResponse = async (
  res: Response,
  callback: () => Promise<unknown>
) => {
  try {
    const response = await callback();
    res.status(200);
    return res.json(response || { success: true });
  } catch (error) {
    res.status(400);
    return res.json({ errors: error.errors || [error.message] });
  }
};
