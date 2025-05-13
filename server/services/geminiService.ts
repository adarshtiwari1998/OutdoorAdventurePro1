interface TranscriptToBlogOptions {
  title: string;
  transcript: string;
  includeSummary: boolean;
  generateTags: boolean;
}

interface BlogPostContent {
  content: string;
  summary: string;
  tags: string[];
}

export class GeminiService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  private get baseUrl() {
    return 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  private async makeRequest(prompt: string) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error making Gemini API request:', error);
      throw error;
    }
  }

  async convertTranscriptToBlogPost(options: TranscriptToBlogOptions): Promise<BlogPostContent> {
    const { title, transcript, includeSummary, generateTags } = options;

    try {
      // First, generate the main blog content
      const blogContentPrompt = `
You are a professional outdoor adventure blogger and content creator. Convert the following YouTube video transcript into a well-structured, engaging blog post.

Title: "${title}"

Transcript:
${transcript.substring(0, 10000)} ${transcript.length > 10000 ? '... (transcript truncated)' : ''}

Guidelines:
1. Write in a conversational, enthusiastic tone that engages outdoor enthusiasts
2. Format with proper headings, paragraphs, and bullet points where appropriate
3. Include an introduction and conclusion
4. Make the content flow naturally and be easy to read
5. Focus on providing valuable information for readers interested in outdoor activities
6. Remove filler words, repetitions, and informal speech patterns from the transcript
7. Length should be 800-1500 words
8. Use markdown formatting for structure

Please generate only the blog post content.
`;

      const blogContent = await this.makeRequest(blogContentPrompt);

      // Generate a summary if requested
      let summary = '';
      if (includeSummary) {
        const summaryPrompt = `
Create a concise, compelling excerpt (120-150 words) for the following blog post about outdoor adventures:

${blogContent.substring(0, 1000)}...

The excerpt should:
1. Capture the main topic and value of the article
2. Use engaging language that appeals to outdoor enthusiasts
3. Make readers want to read the full article
4. Be complete and standalone
`;

        summary = await this.makeRequest(summaryPrompt);
      } else {
        // Extract first paragraph as summary
        const firstParagraph = blogContent.split('\n\n')[0];
        summary = firstParagraph.length > 300 ? 
          firstParagraph.substring(0, 300) + '...' : 
          firstParagraph;
      }

      // Generate tags if requested
      let tags: string[] = [];
      if (generateTags) {
        const tagsPrompt = `
Based on the following blog post about outdoor activities, generate 5-8 relevant tags or keywords.
These tags should be single words or short phrases that accurately represent the main topics of the content.

${blogContent.substring(0, 1000)}...

Format your response as a simple comma-separated list of tags, with no additional text or explanation.
`;

        const tagsResponse = await this.makeRequest(tagsPrompt);
        tags = tagsResponse
          .split(',')
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag.length > 0);
      }

      return {
        content: blogContent,
        summary,
        tags
      };
    } catch (error) {
      console.error('Error converting transcript to blog post:', error);
      throw error;
    }
  }

  async generateBlogPostIdeas(topic: string, count = 5): Promise<string[]> {
    try {
      const prompt = `
Generate ${count} engaging blog post ideas about "${topic}" for an outdoor adventure blog.

For each idea, provide a compelling title that would attract readers interested in outdoor activities.
The titles should be creative, specific, and include keywords relevant to "${topic}".

Format your response as a simple numbered list with just the titles.
`;

      const response = await this.makeRequest(prompt);
      
      // Parse the response into an array of blog post ideas
      return response
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => {
          // Remove numbers and periods from the beginning (e.g., "1. " or "1 - ")
          return line.replace(/^\d+[\.\s-]*\s*/, '').trim();
        })
        .slice(0, count); // Ensure we return exactly the requested number
    } catch (error) {
      console.error(`Error generating blog post ideas for "${topic}":`, error);
      throw error;
    }
  }
}
