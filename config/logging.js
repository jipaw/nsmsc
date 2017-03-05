var intel = require('intel');

var logger = intel.getLogger();
logger.setLevel(intel.ERROR);
logger.basicConfig({
    format: '[%(date)s] %(levelname)s SMSC: %(message)s',
    level: intel.ERROR
});

module.exports = logger;
