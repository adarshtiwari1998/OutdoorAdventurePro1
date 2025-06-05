// Import youtube-transcript package
import { YoutubeTranscript } from 'youtube-transcript';

// Type definitions for the transcript package
declare module 'youtube-transcript' {
  export class YoutubeTranscript {
    static fetchTranscript(videoId: string, options?: { 
      lang?: string; 
      country?: string;
    }): Promise<Array<{ 
      text: string; 
      duration: number; 
      offset: number; 
    }>>;
  }
}

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  duration: number; // Duration in seconds
  videoType: 'video' | 'short';
}

interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
}

export class YouTubeService {
  private apiKey: string | undefined;
  private proxyUrl: string | undefined;

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.proxyUrl = process.env.PROXY_URL; // Optional proxy for transcript requests
  }

  private get baseUrl() {
    return 'https://www.googleapis.com/youtube/v3';
  }

  private async makeRequest(endpoint: string, params: Record<string, string>) {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const searchParams = new URLSearchParams({
      ...params,
      key: this.apiKey
    });

    const url = `${this.baseUrl}/${endpoint}?${searchParams.toString()}`;
    console.log(`🔗 YouTube API Request: ${endpoint} with params:`, params);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`❌ YouTube API Error (${response.status}):`, errorData);

        if (response.status === 403) {
          throw new Error(`YouTube API quota exceeded or invalid API key: ${JSON.stringify(errorData)}`);
        } else if (response.status === 404) {
          throw new Error(`YouTube resource not found: ${JSON.stringify(errorData)}`);
        } else {
          throw new Error(`YouTube API error (${response.status}): ${JSON.stringify(errorData)}`);
        }
      }

      const data = await response.json();
      console.log(`✅ YouTube API Response for ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error('❌ Error making YouTube API request:', error);
      throw error;
    }
  }

  async getChannelDetails(channelId: string): Promise<YouTubeChannel> {
    try {
      const response = await this.makeRequest('channels', {
        part: 'snippet,statistics',
        id: channelId
      });

      if (!response.items || response.items.length === 0) {
        throw new Error(`Channel not found: ${channelId}`);
      }

      const channel = response.items[0];
      return {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnailUrl: channel.snippet.thumbnails.high.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
        videoCount: parseInt(channel.statistics.videoCount) || 0
      };
    } catch (error) {
      console.error(`Error fetching YouTube channel details for ${channelId}:`, error);
      throw error;
    }
  }

  async getVideoDetails(videoId: string): Promise<YouTubeVideo> {
    try {
      const response = await this.makeRequest('videos', {
        part: 'snippet,contentDetails,statistics',
        id: videoId
      });

      if (!response.items || response.items.length === 0) {
        throw new Error(`Video not found: ${videoId}`);
      }

      const video = response.items[0];
      
      // Parse duration from ISO 8601 format (PT4M13S) to seconds
      const duration = this.parseDuration(video.contentDetails.duration);
      
      // Determine if it's a short (typically <= 60 seconds and vertical format)
      const videoType = this.determineVideoType(duration, video);

      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnailUrl: video.snippet.thumbnails.high.url,
        publishedAt: video.snippet.publishedAt,
        channelId: video.snippet.channelId,
        channelTitle: video.snippet.channelTitle,
        duration,
        videoType
      };
    } catch (error) {
      console.error(`Error fetching YouTube video details for ${videoId}:`, error);
      throw error;
    }
  }

  async getChannelVideos(channelId: string, maxResults = 10, existingVideoIds: Set<string> = new Set()): Promise<YouTubeVideo[]> {
    try {
      console.log(`🔍 Fetching up to ${maxResults} NEW videos for channel ${channelId}`);
      console.log(`📊 Existing videos to skip: ${existingVideoIds.size}`);

      // First, get the uploads playlist ID for the channel
      const channelResponse = await this.makeRequest('channels', {
        part: 'contentDetails',
        id: channelId
      });

      if (!channelResponse.items || channelResponse.items.length === 0) {
        throw new Error(`Channel not found: ${channelId}`);
      }

      const uploadsPlaylistId = channelResponse.items[0].contentDetails.relatedPlaylists.uploads;

      let newVideos: any[] = [];
      let pageToken = '';
      let totalFetched = 0;
      let totalSkipped = 0;
      const maxIterations = 10; // Safety limit to prevent infinite loops
      let iterations = 0;

      // Keep fetching until we have enough NEW videos or run out of videos
      while (newVideos.length < maxResults && iterations < maxIterations) {
        iterations++;
        const batchSize = 50; // YouTube API maximum

        console.log(`📄 Iteration ${iterations}: Fetching batch of ${batchSize} videos...`);

        const requestParams: any = {
          part: 'snippet,contentDetails',
          playlistId: uploadsPlaylistId,
          maxResults: batchSize.toString()
        };

        if (pageToken) {
          requestParams.pageToken = pageToken;
        }

        const playlistResponse = await this.makeRequest('playlistItems', requestParams);

        if (!playlistResponse.items || playlistResponse.items.length === 0) {
          console.log(`📄 No more videos found, stopping search`);
          break;
        }

        totalFetched += playlistResponse.items.length;
        console.log(`📦 Retrieved ${playlistResponse.items.length} videos from YouTube API`);

        // Filter out videos that already exist in the database
        for (const item of playlistResponse.items) {
          const videoId = item.contentDetails.videoId;

          if (existingVideoIds.has(videoId)) {
            totalSkipped++;
            console.log(`⏭️ Skipping existing video: ${videoId}`);
            continue;
          }

          // This is a new video
          newVideos.push(item);
          console.log(`✅ Found NEW video: ${videoId} - ${item.snippet.title}`);

          // Stop if we have enough new videos
          if (newVideos.length >= maxResults) {
            console.log(`🎯 Reached target of ${maxResults} new videos`);
            break;
          }
        }

        pageToken = playlistResponse.nextPageToken;
        if (!pageToken) {
          console.log(`📄 No more pages available, stopping search`);
          break;
        }

        console.log(`📊 Progress: ${newVideos.length}/${maxResults} new videos found, ${totalSkipped} skipped`);
      }

      console.log(`📊 Final Summary: Found ${newVideos.length} new videos out of ${totalFetched} total fetched (${totalSkipped} skipped)`);

      if (newVideos.length === 0) {
        console.log(`⚠️ No new videos found for channel ${channelId}`);
        return [];
      }

      // Get the full video details for the new videos
      const videoIds = newVideos.map((item: any) => item.contentDetails.videoId).join(',');
      console.log(`🔍 Fetching detailed info for ${newVideos.length} videos: ${videoIds}`);

      const videosResponse = await this.makeRequest('videos', {
        part: 'snippet,contentDetails,statistics',
        id: videoIds
      });

      if (!videosResponse.items) {
        return [];
      }

      const detailedVideos = videosResponse.items.map((video: any) => {
        // Parse duration and determine video type
        const duration = this.parseDuration(video.contentDetails.duration);
        const videoType = this.determineVideoType(duration, video);
        
        return {
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
          publishedAt: new Date(video.snippet.publishedAt),
          channelId: video.snippet.channelId,
          channelTitle: video.snippet.channelTitle,
          duration,
          videoType
        };
      });

      console.log(`✅ Successfully prepared ${detailedVideos.length} new videos for import`);
      return detailedVideos;
    } catch (error) {
      console.error(`❌ Error fetching YouTube videos for channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Parse ISO 8601 duration (PT4M13S) to seconds
   */
  private parseDuration(isoDuration: string): number {
    if (!isoDuration) return 0;
    
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = isoDuration.match(regex);
    
    if (!matches) return 0;
    
    const hours = parseInt(matches[1] || '0', 10);
    const minutes = parseInt(matches[2] || '0', 10);
    const seconds = parseInt(matches[3] || '0', 10);
    
    return (hours * 3600) + (minutes * 60) + seconds;
  }

  /**
   * Determine if video is a Short based on duration and other factors
   */
  private determineVideoType(duration: number, video: any): 'video' | 'short' {
    // YouTube Shorts are typically:
    // 1. 60 seconds or less in duration
    // 2. Vertical format (9:16 aspect ratio)
    // 3. Often have #Shorts in title or description
    
    const title = video.snippet.title?.toLowerCase() || '';
    const description = video.snippet.description?.toLowerCase() || '';
    
    // Check for explicit Short indicators
    const hasShortIndicator = title.includes('#shorts') || 
                             title.includes('#short') ||
                             description.includes('#shorts') ||
                             description.includes('#short');
    
    // Duration-based detection (primary factor)
    const isShortDuration = duration > 0 && duration <= 60;
    
    // If duration is <= 60 seconds OR has explicit Short indicators, classify as Short
    if (isShortDuration || hasShortIndicator) {
      console.log(`🎬 Detected SHORT: ${video.snippet.title} (${duration}s, hasIndicator: ${hasShortIndicator})`);
      return 'short';
    }
    
    console.log(`🎥 Detected VIDEO: ${video.snippet.title} (${duration}s)`);
    return 'video';
  }

  async searchVideos(query: string, maxResults = 10): Promise<YouTubeVideo[]> {
    try {
      const searchResponse = await this.makeRequest('search', {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: maxResults.toString()
      });

      if (!searchResponse.items) {
        return [];
      }

      const videoIds = searchResponse.items.map((item: any) => item.id.videoId).join(',');
      const videosResponse = await this.makeRequest('videos', {
        part: 'snippet,contentDetails,statistics',
        id: videoIds
      });

      if (!videosResponse.items) {
        return [];
      }

      return videosResponse.items.map((video: any) => {
        // Parse duration and determine video type
        const duration = this.parseDuration(video.contentDetails.duration);
        const videoType = this.determineVideoType(duration, video);
        
        return {
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnailUrl: video.snippet.thumbnails.high.url,
          publishedAt: new Date(video.snippet.publishedAt),
          channelId: video.snippet.channelId,
          channelTitle: video.snippet.channelTitle,
          duration,
          videoType
        };
      });
    } catch (error) {
      console.error(`Error searching YouTube videos for "${query}":`, error);
      throw error;
    }
  }

  async getVideoTranscript(videoId: string): Promise<string> {
    try {
      console.log(`📄 Fetching transcript for: ${videoId}`);

      // Simple delay to avoid rate limiting
      const baseDelay = Math.floor(Math.random() * 5000) + 10000; // 10-15 seconds
      console.log(`⏳ Waiting ${baseDelay/1000}s before transcript request...`);
      await new Promise(resolve => setTimeout(resolve, baseDelay));

      // Use multiple strategies to extract transcript
      let transcriptData;
      let extractionMethod = 'Direct';

      try {
        // Strategy 1: Direct transcript fetch
        console.log(`🔄 Strategy 1/4: Direct for video: ${videoId}`);
        transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
        
        if (!transcriptData || transcriptData.length === 0) {
          console.log(`⚠️ Strategy Direct found no usable transcript for: ${videoId}`);
          throw new Error('No transcript data from direct method');
        }
      } catch (directError) {
        console.log(`❌ Strategy Direct failed for video ${videoId}: ${directError.message}`);
        
        try {
          // Strategy 2: Try with language specification
          console.log(`🔄 Strategy 2/4: With Language for video: ${videoId}`);
          console.log(`⏳ Strategy delay: 60s...`);
          await new Promise(resolve => setTimeout(resolve, 60000));
          
          transcriptData = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
          extractionMethod = 'Language-Specific';
          
          if (!transcriptData || transcriptData.length === 0) {
            throw new Error('No transcript data from language method');
          }
        } catch (langError) {
          console.log(`❌ Strategy Language failed for video ${videoId}: ${langError.message}`);
          
          try {
            // Strategy 3: Try with auto-generated captions
            console.log(`🔄 Strategy 3/4: Auto-generated for video: ${videoId}`);
            console.log(`⏳ Strategy delay: 90s...`);
            await new Promise(resolve => setTimeout(resolve, 90000));
            
            transcriptData = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en', country: 'US' });
            extractionMethod = 'Auto-Generated';
            
            if (!transcriptData || transcriptData.length === 0) {
              throw new Error('No transcript data from auto-generated method');
            }
          } catch (autoError) {
            console.log(`❌ Strategy Auto-generated failed for video ${videoId}: ${autoError.message}`);
            
            // Strategy 4: Final attempt with different parameters
            console.log(`🔄 Strategy 4/4: Final attempt for video: ${videoId}`);
            console.log(`⏳ Strategy delay: 120s...`);
            await new Promise(resolve => setTimeout(resolve, 120000));
            
            try {
              transcriptData = await YoutubeTranscript.fetchTranscript(videoId, {});
              extractionMethod = 'Fallback';
            } catch (finalError) {
              console.log(`❌ All strategies failed for video ${videoId}`);
              throw new Error(`All extraction strategies failed: ${finalError.message}`);
            }
          }
        }
      }
      
      if (transcriptData && transcriptData.length > 0) {
        // Clean and format the transcript - improved cleaning
        const cleanedTranscript = transcriptData
          .map(item => {
            let text = item.text || '';
            // Remove music notation, sound effects, and timestamps
            text = text.replace(/\[.*?\]/g, ''); // Remove [Music], [Applause], etc.
            text = text.replace(/\(.*?\)/g, ''); // Remove (Music), (Applause), etc.
            text = text.replace(/\$.*?\$/g, ''); // Remove dollar sign notation
            text = text.replace(/♪.*?♪/g, ''); // Remove music notes
            text = text.replace(/\s+/g, ' '); // Normalize whitespace
            return text.trim();
          })
          .filter(text => text.length > 0 && !text.match(/^[^\w]*$/)) // Remove empty or non-word content
          .join(' ')
          .replace(/\s+/g, ' ') // Final whitespace cleanup
          .trim();

        // Ensure we have substantial content (not just descriptions)
        if (cleanedTranscript.length > 50) { // Minimum 50 characters for real transcript
          let videoDetails;
          try {
            videoDetails = await this.getVideoDetails(videoId);
          } catch (detailError) {
            console.warn(`⚠️ Could not fetch video details for ${videoId}, using minimal info`);
            videoDetails = {
              title: 'Unknown Title',
              channelTitle: 'Unknown Channel',
              publishedAt: new Date(),
              duration: 0
            };
          }
          
          console.log(`✅ Successfully extracted transcript: ${cleanedTranscript.length} characters using ${extractionMethod}`);
          
          // Return clean transcript without dummy ending text
          return `Channel: ${videoDetails.channelTitle}
Published: ${new Date(videoDetails.publishedAt).toLocaleDateString()}
Video ID: ${videoId}
Duration: ${Math.floor(videoDetails.duration / 60)} minutes ${videoDetails.duration % 60} seconds
Extraction Method: ${extractionMethod}

${cleanedTranscript}`;
        }
      }
      
      console.log(`⚠️ No usable transcript content found for: ${videoId}`);
      throw new Error('No usable transcript content found');

    } catch (error) {
      console.error(`❌ Error fetching transcript for video ${videoId}:`, error.message);
      
      // For failed transcripts, return a simple error message without video description
      if (error.message.includes('captcha') || error.message.includes('too many requests')) {
        return `TRANSCRIPT UNAVAILABLE: YouTube captcha/rate limit detected for video ${videoId}. 

Error: ${error.message}

This video may have captions that require manual extraction or waiting for rate limits to reset.`;
      }
      
      return `TRANSCRIPT UNAVAILABLE: Failed to extract captions for video ${videoId}.

Error: ${error.message}

This video may not have captions or they may not be accessible via automated extraction.`;
    }
  }

  /**
   * Extract potential topics from video title and description
   */
  private extractTopicsFromTitle(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    const topics = [];
    
    // Common outdoor/travel topics
    if (text.includes('beach') || text.includes('coast')) topics.push('Beach/Coastal Activities');
    if (text.includes('hik') || text.includes('trail')) topics.push('Hiking/Trails');
    if (text.includes('camp')) topics.push('Camping');
    if (text.includes('fish')) topics.push('Fishing');
    if (text.includes('cruise') || text.includes('ship')) topics.push('Cruising');
    if (text.includes('rv') || text.includes('trailer') || text.includes('motor')) topics.push('RV/Motorhome');
    if (text.includes('travel') || text.includes('tour')) topics.push('Travel/Tourism');
    if (text.includes('resort') || text.includes('hotel')) topics.push('Accommodations');
    if (text.includes('food') || text.includes('restaurant')) topics.push('Dining');
    if (text.includes('snorkel') || text.includes('dive')) topics.push('Water Sports');
    
    return topics.length > 0 ? topics.join(', ') : 'General outdoor/travel content';
  }

  private async fetchCaptionContent(captionId: string): Promise<string | null> {
    try {
      // Note: YouTube Data API v3 captions.download requires OAuth2 authentication
      // and special permissions. This is a limitation of the public API.
      // For production use, you would need:
      // 1. OAuth2 authentication with the video owner's consent
      // 2. Or use alternative methods like youtube-transcript npm package

      console.log(`⚠️ Caption download requires OAuth2 authentication for caption ID: ${captionId}`);
      return null;
    } catch (error) {
      console.error(`❌ Error downloading caption content:`, error);
      return null;
    }
  }

  

  

  

  
}
//The code has been modified to implement real YouTube caption track fetching and formatting.