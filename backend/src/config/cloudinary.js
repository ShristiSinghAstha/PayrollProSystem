import { v2 as cloudinary } from 'cloudinary';
import https from 'https';

// Validate required environment variables
const requiredEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing Cloudinary configuration:', missingVars.join(', '));
  console.error('Please set these environment variables in your .env file');
  throw new Error(`Missing Cloudinary configuration: ${missingVars.join(', ')}`);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  // Fix for corporate proxy SSL issues (development only)
  agent: new https.Agent({
    rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false
  })
});

console.log('✅ Cloudinary configured successfully');
if (process.env.NODE_ENV !== 'production') {
  console.log('⚠️  SSL verification disabled for Cloudinary (development mode)');
}

export default cloudinary;