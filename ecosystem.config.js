module.exports = {
  apps: [
    {
      name: "sms-dashboard",
      script: "node_modules/.bin/next",
      args: "start",
      env: { NODE_ENV: "production", PORT: 4000 },
    },
    {
      name: "sms-worker",
      script: "worker/sms-worker.ts",
      interpreter: "node",
      interpreter_args: "--loader ts-node/esm",
      env: { NODE_ENV: "production" },
      restart_delay: 5000,
    },
    {
      name: "sms-scheduler",
      script: "worker/scheduler-worker.ts",
      interpreter: "node",
      interpreter_args: "--loader ts-node/esm",
      env: { NODE_ENV: "production" },
      restart_delay: 5000,
    },
  ],
};
