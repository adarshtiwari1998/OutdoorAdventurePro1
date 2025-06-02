/**
 * Cloudinary Service for handling media uploads
 */
import { v2 as cloudinary } from 'cloudinary';
import { promisify } from 'util';
import { Readable } from 'stream';
import ytdl from 'ytdl-core';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

// Root folder for all assets
const ROOT_FOLDER = 'HTHFO_Assets';

// Asset type folders
enum AssetFolders {
  VIDEOS = 'videos',
  MP4 = 'mp4',
  THUMBNAILS = 'thumbnails',
  PRODUCTS = 'products',
  BLOGS = 'blogs',
  ACTIVITIES = 'activities',
  SLIDERS = 'sliders',
  PROFILES = 'profiles',
  CATEGORIES = 'categories',
  ADMIN_DASHBOARD = 'AdminDashboard_Assets'
}

/**
 * Check if Cloudinary is properly configured
 */
function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export class CloudinaryService {
  /**
   * Get the full path for a specific asset folder
   */
  private getFullPath(folder: string): string {
    return `${ROOT_FOLDER}/${folder}`;
  }
  
  /**
   * Upload an image to Cloudinary from a URL
   */
  async uploadImageFromUrl(url: string, assetType: string, publicId: string): Promise<string> {
    if (!isCloudinaryConfigured()) {
      console.warn('Cloudinary is not configured. Returning original URL.');
      return url;
    }

    try {
      const folder = this.getFullPath(assetType);
      console.log(`Uploading image to Cloudinary folder: ${folder}`);
      
      const result = await cloudinary.uploader.upload(url, {
        folder,
        public_id: publicId,
        overwrite: true
      });
      
      console.log(`Successfully uploaded image to Cloudinary: ${result.secure_url}`);
      return result.secure_url;
    } catch (error) {
      console.error(`Error uploading image to Cloudinary:`, error);
      // Fallback to the original URL if upload fails
      return url;
    }
  }

  /**
   * Upload an image for a specific slider
   */
  async uploadSliderImage(url: string, sliderId: string, imageType: 'thumbnail' | 'background'): Promise<string> {
    return this.uploadImageFromUrl(
      url, 
      `${AssetFolders.SLIDERS}/${imageType === 'thumbnail' ? AssetFolders.THUMBNAILS : 'backgrounds'}`, 
      sliderId
    );
  }
  
  /**
   * Upload a YouTube video thumbnail
   */
  async uploadYouTubeThumbnail(url: string, videoId: string): Promise<string> {
    return this.uploadImageFromUrl(
      url,
      `${AssetFolders.VIDEOS}/${AssetFolders.THUMBNAILS}`,
      videoId
    );
  }

  /**
   * Upload a YouTube video to Cloudinary
   * Converts video to MP4 format for direct usage in video tags
   * 
   * Note: This attempts to upload the video to Cloudinary for MP4 conversion
   * If Cloudinary cannot process the YouTube URL directly, it will fallback to
   * using a direct YouTube embed URL
   */
  async uploadYouTubeVideo(youtubeUrl: string, videoId: string): Promise<string> {
    if (!isCloudinaryConfigured()) {
      console.warn('Cloudinary is not configured. Using placeholder video URL.');
      return `/videos/${videoId}.mp4`; // Fallback to local path
    }

    const folder = this.getFullPath(`${AssetFolders.VIDEOS}/${AssetFolders.MP4}`);
    console.log(`Uploading video to Cloudinary folder: ${folder}`);

    try {
      // Method 1: Try using Cloudinary's YouTube video remote fetch
      // This is the most reliable method if security policies allow it
      try {
        const uploadResult = await cloudinary.uploader.upload(youtubeUrl, {
          resource_type: 'video',
          folder: folder,
          public_id: videoId,
          overwrite: true,
          // These parameters help with converting YouTube content to MP4
          transformation: [
            { width: 1280, height: 720, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'mp4' }
          ],
          format: 'mp4',
          // Increase timeout for larger video files
          timeout: 120000 
        });
        
        console.log(`Successfully uploaded video to Cloudinary as MP4:`, {
          publicId: uploadResult.public_id, 
          format: uploadResult.format,
          url: uploadResult.secure_url
        });
        
        // Return the Cloudinary MP4 URL
        return uploadResult.secure_url;
      } catch (directUploadError) {
        console.error(`Direct YouTube URL upload to Cloudinary failed:`, directUploadError);
        
        // Method 2: Try using a YouTube download URL
        // This can sometimes work when direct upload fails
        try {
          // Create a different URL format that might work better with Cloudinary
          // Some Cloudinary accounts can access YouTube content through this format
          const youtubeImageUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          
          // Upload a placeholder image first to ensure the folder structure exists
          await cloudinary.uploader.upload(youtubeImageUrl, {
            folder: folder,
            public_id: `${videoId}_placeholder`,
            overwrite: true
          });
          
          // Now try the video upload with a special YouTube URL format
          const videoResult = await cloudinary.uploader.upload(`youtube:${videoId}`, {
            resource_type: 'video',
            folder: folder,
            public_id: videoId,
            overwrite: true,
            type: 'upload',
            format: 'mp4'
          });
          
          console.log(`Successfully uploaded via alternate YouTube method:`, {
            publicId: videoResult.public_id,
            format: videoResult.format,
            url: videoResult.secure_url
          });
          
          return videoResult.secure_url;
        } catch (alternateMethodError) {
          console.error(`Alternate YouTube upload method failed:`, alternateMethodError);
          throw alternateMethodError; // Pass to outer catch
        }
      }
    } catch (error) {
      console.error(`Error uploading video to Cloudinary as MP4:`, error);
      
      // If all conversion methods fail, fallback to YouTube embed URL
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      console.log(`Falling back to YouTube embed URL: ${embedUrl}`);
      
      // For tracking purposes, store information that this was a fallback
      try {
        // Create a JSON metadata entry for this video to indicate it's a fallback
        await cloudinary.uploader.upload(
          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          {
            folder: folder,
            public_id: `${videoId}_fallback_marker`,
            overwrite: true,
            tags: ["youtube_embed_fallback"],
            context: `youtube_id=${videoId}|fallback=true`
          }
        );
      } catch (tagError) {
        console.warn("Non-critical: Error marking fallback video in Cloudinary:", tagError);
      }
      
      return embedUrl;
    }
  }

  /**
   * Create a direct URL to the YouTube video iframe
   */
  getYouTubeEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  /**
   * Upload a blog post image
   */
  async uploadBlogImage(url: string, blogId: string, imageType: 'featured' | 'content'): Promise<string> {
    return this.uploadImageFromUrl(
      url,
      `${AssetFolders.BLOGS}/${imageType}`,
      blogId
    );
  }
  
  /**
   * Upload a product image
   */
  async uploadProductImage(url: string, productId: string, imageType: 'main' | 'gallery'): Promise<string> {
    return this.uploadImageFromUrl(
      url,
      `${AssetFolders.PRODUCTS}/${imageType}`,
      productId
    );
  }
  
  /**
   * Upload an activity image
   */
  async uploadActivityImage(url: string, activityId: string): Promise<string> {
    return this.uploadImageFromUrl(
      url,
      AssetFolders.ACTIVITIES,
      activityId
    );
  }
  
  /**
   * Upload a category image
   */
  async uploadCategoryImage(url: string, categoryId: string): Promise<string> {
    return this.uploadImageFromUrl(
      url,
      AssetFolders.CATEGORIES,
      categoryId
    );
  }

  /**
   * Upload an admin dashboard logo
   */
  async uploadAdminLogo(url: string, logoId: string): Promise<string> {
    return this.uploadImageFromUrl(
      url,
      `${AssetFolders.ADMIN_DASHBOARD}/logos`,
      logoId
    );
  }

  /**
   * Upload an admin dashboard favicon
   */
  async uploadAdminFavicon(url: string, faviconId: string): Promise<string> {
    return this.uploadImageFromUrl(
      url,
      `${AssetFolders.ADMIN_DASHBOARD}/favicons`,
      faviconId
    );
  }

  /**
   * Upload any admin dashboard asset (supports both URL and base64 data)
   */
  async uploadAdminAsset(urlOrData: string, assetType: 'logos' | 'favicons' | 'general', assetId: string): Promise<string> {
    if (urlOrData.startsWith('data:')) {
      // Handle base64 data upload
      return this.uploadImageFromBase64(
        urlOrData,
        `${AssetFolders.ADMIN_DASHBOARD}/${assetType}`,
        assetId
      );
    } else {
      // Handle URL upload
      return this.uploadImageFromUrl(
        urlOrData,
        `${AssetFolders.ADMIN_DASHBOARD}/${assetType}`,
        assetId
      );
    }
  }

  /**
   * Upload image from base64 data
   */
  private async uploadImageFromBase64(base64Data: string, folder: string, publicId: string): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(base64Data, {
        folder,
        public_id: publicId,
        overwrite: true,
        resource_type: 'auto',
      });

      return result.secure_url;
    } catch (error) {
      console.error('Error uploading image from base64 to Cloudinary:', error);
      throw new Error('Failed to upload image to Cloudinary');
    }
  }

  /**
   * Delete an asset from Cloudinary by public ID
   */
  async deleteAsset(publicId: string): Promise<boolean> {
    if (!isCloudinaryConfigured()) {
      console.warn('Cloudinary is not configured. Cannot delete asset.');
      return false;
    }

    try {
      console.log(`Attempting to delete asset from Cloudinary: ${publicId}`);
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result === 'ok') {
        console.log(`Successfully deleted asset from Cloudinary: ${publicId}`);
        return true;
      } else {
        console.warn(`Cloudinary deletion warning for ${publicId}:`, result);
        return false;
      }
    } catch (error) {
      console.error(`Error deleting asset from Cloudinary (${publicId}):`, error);
      return false;
    }
  }
}

export default new CloudinaryService();