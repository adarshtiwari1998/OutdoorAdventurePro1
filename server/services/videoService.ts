/**
 * Video Service for handling YouTube URL conversions and video processing
 */
import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import ytdl from 'ytdl-core';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { createWriteStream } from 'fs';
import cloudinaryService from './cloudinaryService';
// Use the same cloudinary import that cloudinaryService uses
import { v2 as cloudinary } from 'cloudinary';
import youtubeDlExec from 'youtube-dl-exec';
import ffmpeg from 'fluent-ffmpeg';

// Configure Cloudinary (this is redundant but ensures it works even if CloudinaryService isn't loaded)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

const streamPipeline = promisify(pipeline);

// Function to extract YouTube video ID from various URL formats
export function extractYoutubeVideoId(url: string): string | null {
  // Regular expressions for different YouTube URL formats
  const regexPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?.*v=)([^&\s]+)/,
    /youtube\.com\/shorts\/([^&\s]+)/
  ];

  for (const pattern of regexPatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Function to get a thumbnail URL from YouTube video ID
export function getYoutubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// Main service class for external use
export class VideoService {
  private videoDir: string;
  private thumbnailDir: string;
  
  constructor() {
    // Define the directory structure for video content
    this.videoDir = path.join(process.cwd(), 'public', 'videos');
    this.thumbnailDir = path.join(process.cwd(), 'public', 'thumbnails');
    
    // Create necessary directories immediately
    this.initDirectories().catch(error => {
      console.error("Failed to initialize video directories:", error);
    });
  }
  
  private async initDirectories() {
    try {
      // Create directories if they don't exist
      await fs.ensureDir(this.videoDir);
      await fs.ensureDir(this.thumbnailDir);
      
      console.log(`Video directories initialized:
      - Videos: ${this.videoDir}
      - Thumbnails: ${this.thumbnailDir}`);
    } catch (error) {
      console.error("Error creating video directories:", error);
      throw error;
    }
  }
  
  /**
   * Process a YouTube URL to extract information and download the video as MP4
   * @param youtubeUrl The YouTube URL to process
   * @returns Object containing extracted information, or null if invalid URL
   */
  async processYoutubeUrl(youtubeUrl: string) {
    const videoId = extractYoutubeVideoId(youtubeUrl);
    if (!videoId) {
      return null;
    }

    try {
      console.log(`Processing YouTube URL with video ID: ${videoId}`);
      
      // Get the YouTube thumbnail URL
      const youTubeThumbnailUrl = getYoutubeThumbnail(videoId);
      
      // Upload thumbnail to Cloudinary using the designated folder structure
      const cloudinaryThumbnailUrl = await cloudinaryService.uploadYouTubeThumbnail(
        youTubeThumbnailUrl,
        videoId
      );
      
      console.log(`Uploaded thumbnail to Cloudinary: ${cloudinaryThumbnailUrl}`);
      
      // Create the YouTube embed URL as a fallback
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      
      // Check if we already have a Cloudinary MP4 URL for this video
      try {
        // Search Cloudinary for existing file
        const result = await cloudinary.search
          .expression(`public_id:HTHFO_Assets/videos/mp4/${videoId}`)
          .execute();
          
        if (result && result.resources && result.resources.length > 0) {
          const existingUrl = result.resources[0].secure_url;
          console.log(`Found existing Cloudinary video: ${existingUrl}`);
          
          // Return the information with the existing Cloudinary URL
          return {
            videoId,
            thumbnailUrl: cloudinaryThumbnailUrl,
            directVideoUrl: existingUrl,
            youtubeUrl,
            embedUrl: embedUrl
          };
        }
      } catch (searchError) {
        console.warn(`Error searching Cloudinary for existing video: ${searchError}`);
        // Continue with normal flow if search fails
      }
      
      // Return the initial information with the embed URL as a temporary video URL
      // The actual MP4 URL will be updated by the API endpoint
      return {
        videoId,
        thumbnailUrl: cloudinaryThumbnailUrl,
        directVideoUrl: embedUrl, // Temporarily use embed URL, will be replaced with MP4
        youtubeUrl,
        embedUrl: embedUrl
      };
    } catch (error) {
      console.error('Error processing YouTube URL:', error);
      throw new Error('Failed to process YouTube URL');
    }
  }
  
  /**
   * Download video from YouTube and upload to Cloudinary
   * Note: This should be used carefully as downloading videos from YouTube
   * may violate YouTube's Terms of Service in certain contexts.
   * @param videoId The YouTube video ID
   * @param sliderId Optional slider ID to update with the video URL when download completes
   * @returns The URL to the uploaded video
   */
  async downloadYouTubeVideo(videoId: string, sliderId?: number): Promise<string> {
    try {
      console.log(`Starting YouTube video download and Cloudinary upload for ${videoId}`);
      
      // STEP 1: Download the YouTube video to a local file first
      // This is our primary approach since direct Cloudinary fetch from YouTube doesn't work
      try {
        console.log(`Downloading YouTube video ${videoId} locally...`);
        const localFilePath = await this.downloadYouTubeVideoLocally(videoId);
        
        if (!localFilePath) {
          throw new Error('Failed to download YouTube video locally');
        }
        
        console.log(`Successfully downloaded YouTube video to ${localFilePath}`);
        
        // STEP 2: Upload the local file to Cloudinary
        try {
          // Verify the file exists and has contents
          const fileStats = await fs.stat(localFilePath);
          if (fileStats.size === 0) {
            throw new Error('Local file exists but is empty');
          }
          
          console.log(`Uploading local file ${localFilePath} to Cloudinary (${(fileStats.size / 1024 / 1024).toFixed(2)}MB)...`);
          
          // Create folder structure if needed
          try {
            // Create parent folder first
            await cloudinary.api.create_folder('HTHFO_Assets/videos');
            console.log('Created videos folder in Cloudinary');
          } catch (folderError: any) {
            // Ignore error if folder already exists
            if (folderError.error && folderError.error.message !== 'Folder already exists') {
              console.warn('Videos folder creation warning:', folderError.error?.message || folderError.message);
            }
          }
          
          try {
            // Now create mp4 subfolder
            await cloudinary.api.create_folder('HTHFO_Assets/videos/mp4');
            console.log('Created mp4 subfolder in Cloudinary');
          } catch (folderError: any) {
            // Ignore error if folder already exists
            if (folderError.error && folderError.error.message !== 'Folder already exists') {
              console.warn('MP4 subfolder creation warning:', folderError.error?.message || folderError.message);
            }
          }
          
          // Use Cloudinary's upload API with the local file
          const uploadResult = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'video',
            folder: 'HTHFO_Assets/videos/mp4', // Direct folder reference
            public_id: videoId,
            overwrite: true,
            // Formatting and quality options
            transformation: [
              { width: 1280, height: 720, crop: 'limit' },
              { quality: 'auto:good' },
              { format: 'mp4' }
            ],
            // Set longer timeout for video processing
            timeout: 240000 // Extended timeout for larger files (4 minutes)
          });
          
          console.log(`Successfully uploaded video to Cloudinary:`, {
            publicId: uploadResult.public_id,
            format: uploadResult.format,
            url: uploadResult.secure_url,
            size: uploadResult.bytes ? `${(uploadResult.bytes / 1024 / 1024).toFixed(2)}MB` : 'unknown'
          });
          
          // If a slider ID was provided, update it with the Cloudinary URL
          if (sliderId) {
            try {
              await this.updateSliderWithVideoUrl(sliderId, uploadResult.secure_url);
            } catch (updateError) {
              console.error(`Failed to update slider ${sliderId} with Cloudinary URL:`, updateError);
              // Continue anyway since we have the URL
            }
          }
          
          return uploadResult.secure_url;
        } catch (cloudinaryError) {
          console.error(`Failed to upload local file to Cloudinary:`, cloudinaryError);
          
          // Since we have the local file, we can serve it directly as a fallback
          // The file is already in the public directory
          const publicPath = `/videos/${videoId}.mp4`;
          console.log(`Falling back to locally served video: ${publicPath}`);
          
          // If a slider ID was provided, update it with the local path
          if (sliderId) {
            try {
              await this.updateSliderWithVideoUrl(sliderId, publicPath);
            } catch (updateError) {
              console.error(`Failed to update slider with local video path:`, updateError);
            }
          }
          
          return publicPath;
        }
      } catch (downloadError) {
        console.error(`Failed to download YouTube video:`, downloadError);
        
        // FALLBACK APPROACH: If local download fails, try YouTube embed as last resort
        console.log(`Falling back to YouTube embed URL for ${videoId}`);
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        
        // If a slider ID was provided, update it with the embed URL
        if (sliderId) {
          try {
            await this.updateSliderWithVideoUrl(sliderId, embedUrl);
          } catch (updateError) {
            console.error(`Failed to update slider with embed URL:`, updateError);
          }
        }
        
        return embedUrl;
      }
    } catch (error) {
      console.error(`Unexpected error in video processing pipeline:`, error);
      
      // Absolute fallback - use YouTube embed URL
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      
      // If a slider ID was provided, update it with the embed URL
      if (sliderId) {
        try {
          await this.updateSliderWithVideoUrl(sliderId, embedUrl);
        } catch (updateError) {
          console.error(`Failed to update slider with embed URL:`, updateError);
        }
      }
      
      return embedUrl;
    }
  }
  
  /**
   * Update a specific slider with the final video URL
   * This method should be called once the video upload is complete
   */
  async updateSliderWithVideoUrl(sliderId: number, videoUrl: string): Promise<void> {
    try {
      const { storage } = await import('../storage');
      await storage.updateSliderVideoUrl(sliderId, videoUrl);
      console.log(`Updated slider ${sliderId} with video URL: ${videoUrl}`);
    } catch (error) {
      console.error(`Failed to update slider ${sliderId} with video URL:`, error);
      throw error;
    }
  }
  
  /**
   * Alternative method to download YouTube videos using a more direct approach
   * This tries several methods to get a direct MP4 video file
   */
  async downloadYouTubeVideoDirectly(videoId: string, sliderId?: number): Promise<string> {
    try {
      console.log(`Starting direct download approach for YouTube video ${videoId}`);
      const outputPath = path.join(this.videoDir, `${videoId}.mp4`);
      
      // Check if we already have the file
      if (await fs.pathExists(outputPath)) {
        const stats = await fs.stat(outputPath);
        if (stats.size > 0) {
          console.log(`Video ${videoId} already exists locally at ${outputPath}`);
          
          // Upload the existing file to Cloudinary
          try {
            console.log(`Uploading existing file to Cloudinary...`);
            await this.ensureCloudinaryFolders();
            
            const uploadResult = await cloudinary.uploader.upload(outputPath, {
              resource_type: 'video',
              folder: 'HTHFO_Assets/videos/mp4',
              public_id: videoId,
              overwrite: true,
              transformation: [
                { width: 1280, height: 720, crop: 'limit' },
                { quality: 'auto:good' },
                { format: 'mp4' }
              ],
              timeout: 240000
            });
            
            console.log(`Successfully uploaded existing video to Cloudinary: ${uploadResult.secure_url}`);
            
            // Update slider if provided
            if (sliderId) {
              await this.updateSliderWithVideoUrl(sliderId, uploadResult.secure_url);
            }
            
            return uploadResult.secure_url;
          } catch (error) {
            const cloudinaryError = error as Error;
            console.warn(`Failed to upload existing file to Cloudinary: ${cloudinaryError.message}`);
            // Continue with download to try again
          }
        }
      }
      
      // Ensure the directory exists
      await fs.ensureDir(this.videoDir);
      
      // APPROACH 1: Try using ytdl-core with format selection
      try {
        console.log(`Trying ytdl-core with direct format selection for ${videoId}...`);
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Get video info to select the best format
        const info = await ytdl.getInfo(videoUrl);
        
        // Select a good format - prioritize mp4 with both video and audio
        const formats = info.formats.filter(format => 
          format.container === 'mp4' && 
          format.hasAudio && 
          format.hasVideo
        );
        
        // Sort by quality (height is a good proxy for quality)
        formats.sort((a, b) => (b.height || 0) - (a.height || 0));
        
        if (formats.length === 0) {
          throw new Error('No suitable mp4 format found');
        }
        
        const selectedFormat = formats[0];
        console.log(`Selected format: ${selectedFormat.qualityLabel} (${selectedFormat.container})`);
        
        // Download the video
        const writeStream = createWriteStream(outputPath);
        const videoStream = ytdl(videoUrl, { format: selectedFormat });
        
        // Set up a timeout for the download
        const downloadPromise = streamPipeline(videoStream, writeStream);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Download timed out after 30 seconds')), 30000);
        });
        
        try {
          await Promise.race([downloadPromise, timeoutPromise]);
          
          // Verify the file exists and has content
          const stats = await fs.stat(outputPath);
          if (stats.size === 0) {
            throw new Error('Downloaded file is empty');
          }
          
          console.log(`Successfully downloaded video using ytdl-core to ${outputPath}`);
          
          // Upload to Cloudinary
          await this.ensureCloudinaryFolders();
          
          const uploadResult = await cloudinary.uploader.upload(outputPath, {
            resource_type: 'video',
            folder: 'HTHFO_Assets/videos/mp4',
            public_id: videoId,
            overwrite: true,
            transformation: [
              { width: 1280, height: 720, crop: 'limit' },
              { quality: 'auto:good' },
              { format: 'mp4' }
            ],
            timeout: 240000
          });
          
          console.log(`Successfully uploaded to Cloudinary: ${uploadResult.secure_url}`);
          
          // Update slider if provided
          if (sliderId) {
            await this.updateSliderWithVideoUrl(sliderId, uploadResult.secure_url);
          }
          
          return uploadResult.secure_url;
        } catch (err) {
          const error = err as Error;
          console.warn(`ytdl-core direct download failed: ${error.message}`);
          // Continue to the next approach
        }
      } catch (err) {
        const ytdlError = err as Error;
        console.warn(`ytdl-core approach failed: ${ytdlError.message}`);
        // Continue to the next approach
      }
      
      // APPROACH 2: Try using ffmpeg to download the video stream
      try {
        console.log(`Trying ffmpeg approach for ${videoId}...`);
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Get video info
        const info = await ytdl.getInfo(videoUrl);
        
        // Get audio and video streams separately for better quality
        const videoFormat = ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: format => format.container === 'mp4' });
        const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
        
        if (!videoFormat || !audioFormat) {
          throw new Error('Could not find suitable video or audio formats');
        }
        
        console.log(`Selected video format: ${videoFormat.qualityLabel}`);
        console.log(`Selected audio format: ${audioFormat.audioBitrate}kbps`);
        
        // Create temporary paths for audio and video
        const tempVideoPath = path.join(this.videoDir, `${videoId}_video.mp4`);
        const tempAudioPath = path.join(this.videoDir, `${videoId}_audio.mp4`);
        
        // Download video
        const videoWriteStream = createWriteStream(tempVideoPath);
        const videoStream = ytdl(videoUrl, { format: videoFormat });
        await streamPipeline(videoStream, videoWriteStream);
        
        // Download audio
        const audioWriteStream = createWriteStream(tempAudioPath);
        const audioStream = ytdl(videoUrl, { format: audioFormat });
        await streamPipeline(audioStream, audioWriteStream);
        
        // Merge audio and video with ffmpeg
        await new Promise<void>((resolve, reject) => {
          ffmpeg()
            .input(tempVideoPath)
            .input(tempAudioPath)
            .outputOptions(['-c:v copy', '-c:a aac', '-map 0:v:0', '-map 1:a:0'])
            .output(outputPath)
            .on('end', () => {
              console.log(`Successfully merged audio and video for ${videoId}`);
              resolve();
            })
            .on('error', (err) => {
              console.error(`Error merging audio and video: ${err.message}`);
              reject(err);
            })
            .run();
        });
        
        // Clean up temporary files
        try {
          await fs.unlink(tempVideoPath);
          await fs.unlink(tempAudioPath);
        } catch (err) {
          const cleanupError = err as Error;
          console.warn(`Failed to clean up temporary files: ${cleanupError.message}`);
        }
        
        // Verify the final file
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
          throw new Error('Merged file is empty');
        }
        
        console.log(`Successfully created merged video at ${outputPath}`);
        
        // Upload to Cloudinary
        await this.ensureCloudinaryFolders();
        
        const uploadResult = await cloudinary.uploader.upload(outputPath, {
          resource_type: 'video',
          folder: 'HTHFO_Assets/videos/mp4',
          public_id: videoId,
          overwrite: true,
          transformation: [
            { width: 1280, height: 720, crop: 'limit' },
            { quality: 'auto:good' },
            { format: 'mp4' }
          ],
          timeout: 240000
        });
        
        console.log(`Successfully uploaded to Cloudinary: ${uploadResult.secure_url}`);
        
        // Update slider if provided
        if (sliderId) {
          await this.updateSliderWithVideoUrl(sliderId, uploadResult.secure_url);
        }
        
        return uploadResult.secure_url;
      } catch (err) {
        const ffmpegError = err as Error;
        console.warn(`ffmpeg approach failed: ${ffmpegError.message}`);
        // Continue to the next approach
      }
      
      // APPROACH 3: Use youtube-dl-exec with different options
      try {
        console.log(`Trying youtube-dl-exec with alternative options for ${videoId}...`);
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        await youtubeDlExec(videoUrl, {
          output: outputPath,
          format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
          mergeOutputFormat: 'mp4',
          embedThumbnail: false,
          noCheckCertificates: true,
          noPlaylist: true,
          retries: 10,
          // @ts-ignore - fragmentRetries is supported by youtube-dl-exec but not in the TypeScript definitions
          fragmentRetries: 10,
          recodeVideo: 'mp4',
          addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36']
        });
        
        // Verify the file exists and has content
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
          throw new Error('Downloaded file is empty');
        }
        
        console.log(`Successfully downloaded video using youtube-dl-exec to ${outputPath}`);
        
        // Upload to Cloudinary
        await this.ensureCloudinaryFolders();
        
        const uploadResult = await cloudinary.uploader.upload(outputPath, {
          resource_type: 'video',
          folder: 'HTHFO_Assets/videos/mp4',
          public_id: videoId,
          overwrite: true,
          transformation: [
            { width: 1280, height: 720, crop: 'limit' },
            { quality: 'auto:good' },
            { format: 'mp4' }
          ],
          timeout: 240000
        });
        
        console.log(`Successfully uploaded to Cloudinary: ${uploadResult.secure_url}`);
        
        // Update slider if provided
        if (sliderId) {
          await this.updateSliderWithVideoUrl(sliderId, uploadResult.secure_url);
        }
        
        return uploadResult.secure_url;
      } catch (err) {
        const youtubeDlError = err as Error;
        console.warn(`youtube-dl-exec alternative approach failed: ${youtubeDlError.message}`);
        
        // All approaches failed, use YouTube embed as fallback
        console.log(`All direct download approaches failed, using YouTube embed URL for ${videoId}`);
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        
        // Update slider if provided
        if (sliderId) {
          await this.updateSliderWithVideoUrl(sliderId, embedUrl);
        }
        
        return embedUrl;
      }
    } catch (err) {
      const error = err as Error;
      console.error(`All download approaches failed: ${error.message}`);
      // Fall back to YouTube embed URL
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      
      // Update slider if provided
      if (sliderId) {
        try {
          await this.updateSliderWithVideoUrl(sliderId, embedUrl);
        } catch (err) {
          const updateError = err as Error;
          console.error(`Failed to update slider with embed URL: ${updateError.message}`);
        }
      }
      
      return embedUrl;
    }
  }
  
  /**
   * Helper method to ensure Cloudinary folders exist
   */
  private async ensureCloudinaryFolders(): Promise<void> {
    try {
      // Create parent folder first
      await cloudinary.api.create_folder('HTHFO_Assets/videos');
    } catch (folderError: any) {
      // Ignore error if folder already exists
      if (folderError.error && folderError.error.message !== 'Folder already exists') {
        console.warn('Videos folder creation warning:', folderError.error?.message || folderError.message);
      }
    }
    
    try {
      // Now create mp4 subfolder
      await cloudinary.api.create_folder('HTHFO_Assets/videos/mp4');
    } catch (folderError: any) {
      // Ignore error if folder already exists
      if (folderError.error && folderError.error.message !== 'Folder already exists') {
        console.warn('MP4 subfolder creation warning:', folderError.error?.message || folderError.message);
      }
    }
  }
  
  /**
   * Download a YouTube video and save it locally
   * This is used both as a fallback if Cloudinary upload fails, and also as 
   * a primary method for downloading videos to then upload to Cloudinary
   */
  private async downloadYouTubeVideoLocally(videoId: string): Promise<string> {
    const outputPath = path.join(this.videoDir, `${videoId}.mp4`);
    
    // Check if the video already exists and is not empty
    if (await fs.pathExists(outputPath)) {
      try {
        const stats = await fs.stat(outputPath);
        if (stats.size > 0) {
          console.log(`Video ${videoId} already exists locally at ${outputPath} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
          return outputPath;
        } else {
          console.log(`Found empty video file for ${videoId}, will re-download`);
          // Continue with download as the file is empty
          // Remove the empty file
          await fs.unlink(outputPath);
        }
      } catch (error) {
        console.error(`Error checking existing video file: ${error}`);
        // Continue with download as checking the file failed
      }
    }
    
    // Make sure directory exists
    await fs.ensureDir(this.videoDir);
    
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const tempPath = `${outputPath}.download`;
    
    // First try using youtube-dl-exec as it's more reliable
    try {
      console.log(`Attempting to download YouTube video ${videoId} using youtube-dl-exec...`);
      
      try {
        // Remove any existing temporary file
        if (await fs.pathExists(tempPath)) {
          await fs.unlink(tempPath);
        }
      } catch (error) {
        console.warn(`Could not remove existing temp file: ${error}`);
      }
      
      // Download with youtube-dl-exec (better compatibility)
      try {
        // Create a timeout promise that rejects after 15 seconds
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('YouTube download timeout after 15 seconds')), 15000);
        });
        
        // Create the youtube-dl-exec promise
        const downloadPromise = youtubeDlExec(videoUrl, {
          output: tempPath,
          format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
          noCheckCertificates: true,
          noPlaylist: true,
          youtubeSkipDashManifest: true,
          preferFreeFormats: true,
          addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36']
        });
        
        // Race the download against the timeout
        const result = await Promise.race([downloadPromise, timeoutPromise]);
        
        console.log('youtube-dl-exec download results:', result);
        
        // Check if download worked
        if (await fs.pathExists(tempPath)) {
          const fileStats = await fs.stat(tempPath);
          if (fileStats.size > 0) {
            console.log(`Downloaded ${(fileStats.size / 1024 / 1024).toFixed(2)}MB to temporary file`);
            
            // Move the temp file to the final location
            await fs.rename(tempPath, outputPath);
            
            console.log(`Successfully downloaded YouTube video ${videoId} to ${outputPath}`);
            return outputPath;
          } else {
            console.error('Downloaded file is empty, will try alternative method');
            await fs.unlink(tempPath);
          }
        } else {
          console.error('youtube-dl-exec did not create a file, will try alternative method');
        }
      } catch (ytDlError) {
        console.error(`youtube-dl-exec download failed: ${ytDlError}`);
        // Will fall through to next method
      }
      
      // If we got here, youtube-dl-exec failed
      console.log('Falling back to ytdl-core download method...');
      
      // Try ytdl-core as a fallback method
      try {
        console.log(`Downloading YouTube video ${videoId} with ytdl-core to ${outputPath}`);
        
        // Get the video info first to determine best format
        const info = await ytdl.getInfo(videoId);
        
        if (!info || !info.formats || info.formats.length === 0) {
          throw new Error('No video formats found');
        }
        
        console.log(`Available formats: ${info.formats.length}`);
        
        // First try to get a format with both video and audio
        let format = ytdl.chooseFormat(info.formats, { 
          quality: 'highest', 
          filter: 'videoandaudio' 
        });
        
        if (!format) {
          // If no combined format is available, try to get a video format
          console.log("No combined video+audio format found, falling back to highest video quality");
          format = ytdl.chooseFormat(info.formats, { quality: 'highest' });
        }
        
        if (!format) {
          // If still no format, try any available format
          console.log("No standard formats found, trying any available format");
          if (info.formats.length > 0) {
            format = info.formats[0];
          } else {
            throw new Error('No suitable video format found');
          }
        }
        
        console.log(`Selected format for ${videoId}: ${format.qualityLabel || 'unknown'}, ${format.container || 'unknown'}, ${format.mimeType || 'unknown'}`);
        
        // Create the download stream with explicit format
        const videoReadableStream = ytdl(videoUrl, { format });
        
        // Create the write stream to the temporary file
        const videoWritableStream = createWriteStream(tempPath);
        
        // Track download progress
        let lastLogged = 0;
        let downloadStarted = false;
        
        videoReadableStream.on('progress', (chunkLength, downloaded, total) => {
          downloadStarted = true;
          
          const percent = downloaded / total * 100;
          // Log at 0%, 10%, 20%, ... 100% to avoid too many logs
          if (percent >= lastLogged + 10 || percent === 100) {
            lastLogged = Math.floor(percent / 10) * 10;
            console.log(`Downloading ${videoId}: ${percent.toFixed(0)}% (${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)`);
          }
        });
        
        // Handle errors on both streams
        videoReadableStream.on('error', (err) => {
          console.error(`Error in download stream: ${err.message}`);
          videoWritableStream.end();
        });
        
        videoWritableStream.on('error', (err) => {
          console.error(`Error writing to file: ${err.message}`);
        });
        
        // Timeout check to prevent stuck downloads
        const downloadTimeout = setTimeout(() => {
          if (!downloadStarted) {
            console.error(`Download timed out for ${videoId} - no data received`);
            videoReadableStream.destroy();
            videoWritableStream.end();
          }
        }, 30000); // 30 second timeout
        
        try {
          // Pipe the download to the temp file
          await streamPipeline(videoReadableStream, videoWritableStream);
          
          // Clear the timeout
          clearTimeout(downloadTimeout);
          
          // Verify file size
          const fileStats = await fs.stat(tempPath);
          if (fileStats.size === 0) {
            throw new Error('Downloaded file is empty');
          }
          
          console.log(`Downloaded ${(fileStats.size / 1024 / 1024).toFixed(2)}MB to temporary file`);
          
          // Move the temp file to the final location
          await fs.rename(tempPath, outputPath);
          
          console.log(`Successfully downloaded YouTube video ${videoId} to ${outputPath}`);
          
          return outputPath;
        } catch (pipelineError: any) {
          clearTimeout(downloadTimeout);
          console.error(`Pipeline error: ${pipelineError.message}`);
          
          // Clean up temp file
          try {
            if (await fs.pathExists(tempPath)) {
              await fs.unlink(tempPath);
            }
          } catch (unlinkError) {
            console.error(`Error removing temp file: ${unlinkError}`);
          }
          
          throw pipelineError;
        }
      } catch (ytdlError) {
        console.error(`ytdl-core download method failed: ${ytdlError}`);
        throw ytdlError;
      }
    } catch (error: any) {
      console.error(`All download methods failed for video ${videoId}:`, error);
      throw new Error(`Failed to download video: ${error.message}`);
    }
  }
}

export default new VideoService();