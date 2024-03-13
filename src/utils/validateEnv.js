require('dotenv').config();
const { cleanEnv, str, port } = require('envalid');

module.exports = cleanEnv(process.env, {
    MONGO_CONNECTION_STRING: str(),
    PORT: port(),
    SESSION_SECRET: str(),
})