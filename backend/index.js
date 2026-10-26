// Vercel entrypoint: must exist before the build, so it loads the tsc output from dist/.
module.exports = require('./dist/app.js');
