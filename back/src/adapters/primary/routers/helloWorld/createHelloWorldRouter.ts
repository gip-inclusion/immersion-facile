import { Router } from "express";

export const createHelloWorldRouter = () => {
  const helloWorldRouter = Router();
  helloWorldRouter
    .route("/")
    .get((_req, res) => res.json({ message: "Hello World !" }));
  return helloWorldRouter;
};
