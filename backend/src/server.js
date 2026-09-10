const app = require("./app");
const env = require("./config/env");

app.listen(env.port, () => {
  console.log(`ElectroStock backend listening on http://localhost:${env.port}`);
});
