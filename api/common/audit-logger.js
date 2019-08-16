const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;

const logger = createLogger({
    format: combine(format.timestamp(), format.json()),
    transports: [
      // - Write to all access logs with level `info`
      new transports.File({ filename: process.env.ROOT_DIR+'logs/access.log', level: 'info' })
    ]
});

exports.logActivity = function(auditObj) {
    logger.log({
        level: "info",
        ...auditObj
    });
}