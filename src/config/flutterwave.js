const Flutterwave = require('flutterwave-node-v3');
const dotenv = require('dotenv');

dotenv.config();

const FLW_PUBLIC_KEY = process.env.FLW_PUBLIC_KEY;
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

if (!FLW_PUBLIC_KEY || !FLW_SECRET_KEY) {
    console.warn('Warning: Flutterwave API keys are missing in environment variables.');
}

const flw = new Flutterwave(FLW_PUBLIC_KEY, FLW_SECRET_KEY);

module.exports = flw;
