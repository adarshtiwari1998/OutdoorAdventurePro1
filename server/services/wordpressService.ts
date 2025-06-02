interface WordPressPostImportOptions {
  url: string;
  username: string;
  applicationPassword?: string; // Use application password instead of regular password
  count?: number;
  page?: number; // Add pagination support
}

interface WordPressPost {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  categoryId?: string;
  tags: string[];
  date: string;
  author: {
      name: string;
      avatar: string;
  };
}

export class WordPressService {
async importPosts(options: WordPressPostImportOptions): Promise<WordPressPost[]> {
      let { url, username, applicationPassword, count = 10, page = 1 } = options;
      // Validate the WordPress URL
      const baseUrl = this.normalizeWordPressUrl(url);
      try {
          // Fetch posts using Basic Authentication
          const posts = await this.fetchPosts(baseUrl, username, applicationPassword, count, page);
          return posts;
      } catch (error) {
          console.error('Error importing WordPress posts:', error);
          throw new Error(`Failed to import WordPress posts: \${(error as Error).message}`);
      }
  }
  private normalizeWordPressUrl(url: string): string {
      // Remove trailing slash if present
      let baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      // Ensure the URL has protocol
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          baseUrl = `https://\${baseUrl}`;
      }
      return baseUrl;
  }

    private async fetchPosts(
        baseUrl: string,
        username: string,
        applicationPassword: string | undefined,
        count: number,
        page: number = 1,
    ): Promise<WordPressPost[]> {
        try {
            if (!username || !applicationPassword) {
                throw new Error(
                    "Username and application password are required",
                );
            }

            // First get list of posts with pagination
            const postsListUrl = `${baseUrl}/wp-json/wp/v2/posts?_embed&per_page=${count}&status=publish&page=${page}`;
            const posts = [];

            console.log(
                "Fetching WordPress posts list from URL:",
                postsListUrl,
            );

            const authHeader = "Basic " + Buffer.from(username + ":" + applicationPassword).toString("base64");
            
            const listResponse = await fetch(postsListUrl, {
                headers: {
                    Authorization: authHeader,
                    Accept: "application/json",
                },
            });

            if (!listResponse.ok) {
                throw new Error(`WordPress API error: ${listResponse.status}`);
            }

            const postsList = await listResponse.json();

            // Then fetch each post individually to get full content
            for (const post of postsList) {
                const postUrl = `${baseUrl}/wp-json/wp/v2/posts/${post.id}?_embed`;
                console.log("Fetching WordPress posts from URL:", postUrl);
                console.log("Using auth header:", authHeader);

                const response = await fetch(postUrl, {
                    headers: {
                        Authorization: authHeader,
                        Accept: "application/json",
                    },
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(
                        `WordPress API Error (${response.status}):`,
                        errorText,
                    );
                    throw new Error(
                        `WordPress API error: ${response.status} ${response.statusText} - ${errorText}`,
                    );
                }

                const postResponse = await fetch(postUrl, {
                    headers: {
                        Authorization: authHeader,
                        Accept: "application/json",
                    },
                });

                if (postResponse.ok) {
                    const fullPost = await postResponse.json();
                    posts.push(fullPost);
                }
            }

            console.log(
                "WordPress API Response:",
                JSON.stringify(posts, null, 2),
            );

            const formattedPosts = posts.map((post: any) => {
                // Clean up title - remove HTML entities and special characters
                const cleanTitle = post.title.rendered
                    .replace(/&#038;/g, "and")
                    .replace(/[^\w\s-]/g, "")
                    .trim();

                // Create clean slug
                const cleanSlug = cleanTitle
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^\w-]/g, "");

                return {
                    ...this.formatWordPressPost(post),
                    title: cleanTitle,
                    slug: cleanSlug,
                    content: post.content?.rendered || "", // Keep full HTML content
                };
            });
            console.log(
                `Successfully formatted ${formattedPosts.length} posts`,
            );
            return formattedPosts;
        } catch (error) {
            console.error("Error fetching WordPress posts:", error);
            throw error; // Preserve the original error message
        }
    }

  private formatWordPressPost(post: any): WordPressPost {
      let featuredImage = '';
      if (post._embedded &&
          post._embedded['wp:featuredmedia'] &&
          post._embedded['wp:featuredmedia'][0] &&
          post._embedded['wp:featuredmedia'][0].source_url) {
          featuredImage = post._embedded['wp:featuredmedia'][0].source_url;
      }

      let authorName = 'Unknown';
      let authorAvatar = '';
      if (post._embedded &&
          post._embedded.author &&
          post._embedded.author[0]) {
          authorName = post._embedded.author[0].name || 'Unknown';
          authorAvatar = post._embedded.author[0].avatar_urls &&
              post._embedded.author[0].avatar_urls['96'] ?
              post._embedded.author[0].avatar_urls['96'] : '';
      }

      let categoryId;
      if (post._embedded &&
          post._embedded['wp:term'] &&
          post._embedded['wp:term'][0] &&
          post._embedded['wp:term'][0].length > 0) {
          // Get the first category - we'll need to map this to our local category ID later
          categoryId = post._embedded['wp:term'][0][0].id.toString();
      }

      let tags: string[] = [];
      if (post._embedded &&
          post._embedded['wp:term'] &&
          post._embedded['wp:term'][1]) {
          tags = post._embedded['wp:term'][1].map((tag: any) => tag.name);
      }

      return {
          id: post.id,
          title: post.title.rendered,
          content: post.content.rendered,
          excerpt: post.excerpt.rendered,
          featuredImage,
          categoryId: 1, // Use default category ID
          tags,
          date: post.date ? new Date(post.date).toISOString() : new Date().toISOString(),
          author: {
              name: authorName,
              avatar: authorAvatar,
          },
      };
  }

  // Get a single post by ID
  async getPostById(baseUrl: string, username: string, applicationPassword: string, postId: number): Promise<WordPressPost | null> {
      const postUrl = `\${baseUrl}/wp-json/wp/v2/posts/${postId}?_embed`;
      const authHeader = 'Basic ' + btoa(username + ':' + applicationPassword);

      try {
          const response = await fetch(postUrl, {
              headers: {
                  'Authorization': authHeader,
              },
          });

          if (!response.ok) {
              if (response.status === 404) {
                  return null;
              }
              throw new Error(`Failed to fetch post: \${response.statusText}`);
          }

          const post = await response.json();
          return this.formatWordPressPost(post);
      } catch (error) {
          console.error(`Error fetching WordPress post \${postId}:`, error);
          throw new Error(`Failed to fetch post from WordPress: \${(error as Error).message}`);
      }
  }

  // Get categories
  async getCategories(baseUrl: string, username: string, applicationPassword: string,): Promise<any[]> {
      const categoriesUrl = `\${baseUrl}/wp-json/wp/v2/categories`;
       const authHeader = 'Basic ' + btoa(username + ':' + applicationPassword);

      try {
          const response = await fetch(categoriesUrl, {
              headers: {
                   'Authorization': authHeader,
              },
          });

          if (!response.ok) {
              throw new Error(`Failed to fetch categories: \${response.statusText}`);
          }

          const categories = await response.json();
          return categories.map((category: any) => ({
              id: category.id,
              name: category.name,
              slug: category.slug,
              description: category.description,
              count: category.count
          }));
      } catch (error) {
          console.error('Error fetching WordPress categories:', error);
          throw new Error('Failed to fetch categories from WordPress');
      }
  }
}