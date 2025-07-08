const Log = require('../models/Log');

const createLog = async ({ userId, taskId, action }) => {
  try {
    await Log.create({ userId, taskId, action });
  } catch (err) {
    console.error('Log creation failed:', err.message);
  }
};

module.exports = createLog;
