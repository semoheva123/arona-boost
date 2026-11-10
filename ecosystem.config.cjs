module.exports = {
  apps: [
    {
      name: 'arona-boost',
      script: './server/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '320M',
      node_args: '--max-old-space-size=280',
      env: {
        NODE_ENV: 'production',
        PORT: 3085,
        LIVE_IMAGE_CACHE_SIZE: 40
      }
    }
  ]
};
