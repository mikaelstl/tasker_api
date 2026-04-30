import * as dotenv from 'dotenv';

dotenv.config();

const DB_URL = process.env.DB_URL as string;
const API_PORT = process.env.PORT || 3000 as number;
const SECRET = process.env.SECRET as string;

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_KEY = process.env.SUPABASE_KEY as string;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'profile_images' as string

export {
  DB_URL,
  API_PORT,
  SECRET,
  SUPABASE_URL,
  SUPABASE_KEY,
  SUPABASE_BUCKET
};