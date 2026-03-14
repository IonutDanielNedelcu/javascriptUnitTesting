require('dotenv').config();

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

if (!JWT_SECRET_KEY && process.env.NODE_ENV !== 'test') {
    throw new Error('JWT_SECRET_KEY must be set in environment (or .env)');
}

module.exports = {
    JWT_SECRET_KEY,
};