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
      env: { NODE_ENV: "production" },
      max_restarts: 5,
      restart_delay: 30000, // wait 30s between restarts — not a tight loop
      cron_restart: "*/5 * * * *", // also restart every 5 min as a safety net
    },
    {
      name: "sms-scheduler",
      script: "dist/worker/scheduler-worker.js",
      interpreter: "node",
      env: { NODE_ENV: "production" },
      max_restarts: 5,
      restart_delay: 30000,
      cron_restart: "*/5 * * * *",
    },
  ],
};
