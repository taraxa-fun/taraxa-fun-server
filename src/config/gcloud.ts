import { Storage } from '@google-cloud/storage';
import { ImageAnnotatorClient } from '@google-cloud/vision';

export const storage = new Storage({
    credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS || ''),
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  });

export const vision = new ImageAnnotatorClient({
  credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS || ''),
});

export const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME || '');