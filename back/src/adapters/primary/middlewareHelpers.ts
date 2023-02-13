import { Response } from "express";

export const unauthorized = (res: Response) =>
  res.status(401).json({ error: `You need to authenticate first` });

export const forbidden = (res: Response, errorMessage: string) =>
  res.status(403).json({ error: errorMessage });
