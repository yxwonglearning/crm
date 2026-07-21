const { createApp } = require('./app');
const { config } = require('./shared/config');
const actionFlowRuntime = require('./modules/action-flows/action-flows.runtime');

const app = createApp();

app.listen(config.port, () => {
  console.log(`${config.appName} running on http://localhost:${config.port}`);
  actionFlowRuntime.startScheduler();
});
