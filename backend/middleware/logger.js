// middleware/logger.js
const logger = {
  info:  (msg, data) => console.log(`[${new Date().toISOString()}] [INFO]  ${msg}`, data ? JSON.stringify(data) : ''),
  warn:  (msg, data) => console.warn(`[${new Date().toISOString()}] [WARN]  ${msg}`, data ? JSON.stringify(data) : ''),
  error: (msg, data) => console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`, data ? JSON.stringify(data) : ''),
};

module.exports = logger;
