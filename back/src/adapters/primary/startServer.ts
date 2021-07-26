import { app } from "./server";

const port = 1234;

app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
