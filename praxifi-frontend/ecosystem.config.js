module.exports = {
  apps: [
    {
      name: 'praxifi-frontend',
      cwd: '/opt/praxifi/praxifi-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 2,  // Use 2 instances for load balancing
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_TELEMETRY_DISABLED: 1
      },
      error_file: '/opt/praxifi/logs/frontend-error.log',
      out_file: '/opt/praxifi/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 3000,
      kill_timeout: 5000
    }
  ]
};
