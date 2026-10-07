module.exports = {
  apps: [
    {
      name: "sms-dashboard",
      script: "node_modules/.bin/next",
      args: "start",
      env: { NODE_ENV: "production", PORT: 4000 },
      max_restarts: 10,
      restart_delay: 5000,
    },
    {
      name: "sms-worker",
      script: "dist/worker/sms-worker.js",
      interpreter: "node",
      interpreter_args: "-r dotenv/config",
      env: { NODE_ENV: "production", DOTENV_CONFIG_PATH: "/var/www/sms/.env" },
      max_restarts: 5,
      restart_delay: 30000,
      cron_restart: "*/5 * * * *",
    },
    {
      name: "sms-scheduler",
      script: "dist/worker/scheduler-worker.js",
      interpreter: "node",
      interpreter_args: "-r dotenv/config",
      env: { NODE_ENV: "production", DOTENV_CONFIG_PATH: "/var/www/sms/.env" },
      max_restarts: 5,
      restart_delay: 30000,
      cron_restart: "*/5 * * * *",
    },
  ],
};
