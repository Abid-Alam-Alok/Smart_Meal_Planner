import {Ratelimit} from '@upstash/ratelimit'
import {Redis} from '@upstash/redis'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Configure dotenv to use .env file from root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Allow 10 requests per 10 seconds
const ratelimit = new Ratelimit({
    redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export { ratelimit };