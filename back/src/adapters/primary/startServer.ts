import { app } from "./server";
import { logger } from "../../utils/logger";

const port = 1234;

app.listen(port, () => {
  logger.info(`server started at http://localhost:${port}`);
});
