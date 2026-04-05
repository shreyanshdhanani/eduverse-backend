import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

@Injectable()
export class CloudinaryService {
  /**
   * Upload a file buffer to Cloudinary.
   * @param buffer  - The file buffer (from multer memoryStorage)
   * @param folder  - Target Cloudinary folder (e.g. 'lms/courses/thumbnails')
   * @param resourceType - 'image' | 'video' | 'raw' | 'auto'
   */
  async uploadFile(
    buffer: Buffer,
    folder: string,
    resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto',
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          // Allow large video files
          chunk_size: 6000000, // 6MB chunks for reliable video upload
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) return reject(new Error(error.message));
          if (!result) return reject(new Error('Cloudinary returned no result'));
          resolve({ secure_url: result.secure_url, public_id: result.public_id });
        },
      );

      Readable.from(buffer).pipe(uploadStream);
    });
  }

  /**
   * Delete a file from Cloudinary by its public_id.
   */
  async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  }
}
