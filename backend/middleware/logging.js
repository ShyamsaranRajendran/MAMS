const Log = require('../models/Log');

const writeLog = (action, entity) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
      try {
        if (res.statusCode < 400) {
          const logEntry = new Log({
            // Use optional chaining and fallback
            userId: req.user?._id || 'anonymous',
            action,
            entity,
            entityId: req.body._id || req.params.id || req.user?._id || null,
            details: {
              method: req.method,
              url: req.url,
              body: req.body,
              params: req.params
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          });

          logEntry.save().catch(err => console.error('Logging error:', err));
        }
      } catch (err) {
        console.error('Logging middleware error:', err);
      }

      originalSend.call(this, data);
    };

    next();
  };
};

module.exports = { writeLog };
