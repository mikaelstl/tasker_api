import * as dotenv from 'dotenv';

dotenv.config();

const DB_URL = process.env.DB_URL as string;
const API_PORT = process.env.API_PORT || 0 as number;
const SECRET = process.env.SECRET as string;

export { DB_URL, API_PORT, SECRET };