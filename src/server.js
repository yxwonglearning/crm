const { createApp } = require('./app');
const { config } = require('./shared/config');

const app = createApp();

app.listen(config.port, () => {
  console.log(`${config.appName} running on http://localhost:${config.port}`);
});
