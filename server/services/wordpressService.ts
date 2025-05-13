interface WordPressPostImportOptions {
  url: string;
  username: string;
  password: string;
  count?: number;
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
    const { url, username, password, count = 10 } = options;
    
    // Validate the WordPress URL
    const baseUrl = this.normalizeWordPressUrl(url);
    
    try {
      // Get authentication token
      const token = await this.getAuthToken(baseUrl, username, password);
      
      // Fetch posts
      const posts = await this.fetchPosts(baseUrl, token, count);
      
      return posts;
    } catch (error) {
      console.error('Error importing WordPress posts:', error);
      throw new Error(`Failed to import WordPress posts: ${(error as Error).message}`);
    }
  }
  
  private normalizeWordPressUrl(url: string): string {
    // Remove trailing slash if present
    let baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    
    // Ensure the URL has protocol
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    
    return baseUrl;
  }
  
  private async getAuthToken(baseUrl: string, username: string, password: string): Promise<string> {
    const authUrl = `${baseUrl}/wp-json/jwt-auth/v1/token`;
    
    try {
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Authentication failed');
      }
      
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error getting WordPress auth token:', error);
      throw new Error('Failed to authenticate with WordPress');
    }
  }
  
  private async fetchPosts(baseUrl: string, token: string, count: number): Promise<WordPressPost[]> {
    const postsUrl = `${baseUrl}/wp-json/wp/v2/posts?_embed&per_page=${count}`;
    
    try {
      const response = await fetch(postsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`);
      }
      
      const posts = await response.json();
      
      return posts.map((post: any) => this.formatWordPressPost(post));
    } catch (error) {
      console.error('Error fetching WordPress posts:', error);
      throw new Error('Failed to fetch posts from WordPress');
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
      categoryId,
      tags,
      date: post.date,
      author: {
        name: authorName,
        avatar: authorAvatar,
      },
    };
  }
  
  // Get a single post by ID
  async getPostById(baseUrl: string, token: string, postId: number): Promise<WordPressPost | null> {
    const postUrl = `${baseUrl}/wp-json/wp/v2/posts/${postId}?_embed`;
    
    try {
      const response = await fetch(postUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch post: ${response.statusText}`);
      }
      
      const post = await response.json();
      return this.formatWordPressPost(post);
    } catch (error) {
      console.error(`Error fetching WordPress post ${postId}:`, error);
      throw new Error(`Failed to fetch post from WordPress: ${(error as Error).message}`);
    }
  }
  
  // Get categories
  async getCategories(baseUrl: string, token: string): Promise<any[]> {
    const categoriesUrl = `${baseUrl}/wp-json/wp/v2/categories`;
    
    try {
      const response = await fetch(categoriesUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
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
