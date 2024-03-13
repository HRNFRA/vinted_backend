require('dotenv').config();
const { cleanEnv, str, port } = require('envalid');

module.exports = cleanEnv(process.env, {
    MONGO_CONNECTION_STRING: str(),
    PORT: port(),
    SESSION_SECRET: str(),
    CLOUDINARY_NAME: str(),
    CLOUDINARY_API_KEY: str(),
    CLOUDINARY_API_SECRET: str(),
})