import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer with memory storage
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Upload to Cloudinary using a stream
export const uploadToCloudinary = (fileBuffer: Buffer, folder: string = 'pulse_documents'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto', // supports images and pdfs
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          return reject(error);
        }
        if (result && result.secure_url) {
          resolve(result.secure_url);
        } else {
          reject(new Error("Cloudinary upload failed: No secure_url returned"));
        }
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};
