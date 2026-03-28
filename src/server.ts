import app from "./app";
import { env } from "./config/env";
import logger from "./lib/logger";

const host = "0.0.0.0";

app.listen(env.PORT, host, () => {
  logger.info(`EasyTrip backend listening on ${host}:${env.PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});

