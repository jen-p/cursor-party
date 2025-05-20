interface SteamConfig {
  apiKey: string;
  steamId: string;
}

interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;  // in minutes
  img_icon_url: string;
  has_community_visible_stats: boolean;
}

interface SteamGameDetails {
  name: string;
  steam_appid: number;
  header_image: string;
  background: string;
  categories: Array<{ id: number; description: string }>;
}

interface SteamGameAchievements {
  achieved: number;
  total: number;
}

export class SteamIntegration {
  private config: SteamConfig;
  private baseUrl = 'https://api.steampowered.com';
  private corsProxy = 'https://cors-anywhere.herokuapp.com/';

  constructor(config: SteamConfig) {
    this.config = config;
    console.log('Initializing Steam integration with Steam ID:', config.steamId);
  }

  private async makeRequest(url: string): Promise<Response> {
    // Add CORS proxy to the URL
    const proxyUrl = this.corsProxy + url;
    console.log('Making request to:', proxyUrl);
    
    const response = await fetch(proxyUrl, {
      headers: {
        'Origin': 'https://localhost:3000'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Error response:', text);
      throw new Error(`Steam API error: ${response.status} - ${text || response.statusText}`);
    }
    
    return response;
  }

  /**
   * Test the Steam connection with provided credentials
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Steam connection...');
      const url = `${this.baseUrl}/ISteamUser/GetPlayerSummaries/v2/?key=${this.config.apiKey}&steamids=${this.config.steamId}`;
      const response = await this.makeRequest(url);
      const data = await response.json();
      
      console.log('Player summary response:', data);
      
      if (!data.response?.players?.length) {
        console.error('No player data found');
        return false;
      }
      
      const player = data.response.players[0];
      console.log('Found player:', player.personaname);
      return true;
    } catch (error) {
      console.error('Steam connection test failed:', error);
      throw error;
    }
  }

  /**
   * Get the list of owned games for the configured Steam user
   */
  async getOwnedGames(): Promise<SteamGame[]> {
    try {
      console.log('Fetching owned games...');
      const url = `${this.baseUrl}/IPlayerService/GetOwnedGames/v1/?key=${this.config.apiKey}&steamid=${this.config.steamId}&include_appinfo=1&include_played_free_games=1`;
      const response = await this.makeRequest(url);
      const data = await response.json();
      
      console.log('Games response:', data);
      
      if (!data.response?.games) {
        console.error('No games found in response');
        throw new Error('No games found in Steam library. Please check your profile privacy settings.');
      }
      
      console.log(`Found ${data.response.games.length} games`);
      return data.response.games;
    } catch (error) {
      console.error('Failed to get owned games:', error);
      throw error;
    }
  }

  /**
   * Get detailed information for a specific game
   */
  async getGameDetails(appId: number): Promise<SteamGameDetails | null> {
    try {
      console.log(`Fetching details for game ${appId}...`);
      const response = await this.makeRequest(
        `https://store.steampowered.com/api/appdetails?appids=${appId}`
      );
      const data = await response.json();
      
      if (!data[appId]?.success) {
        console.log(`No details available for game ${appId}`);
        return null;
      }
      
      return data[appId].data;
    } catch (error) {
      console.error(`Failed to get details for game ${appId}:`, error);
      return null;
    }
  }

  /**
   * Get achievement statistics for a specific game
   */
  async getGameAchievements(appId: number): Promise<SteamGameAchievements | null> {
    try {
      console.log(`Fetching achievements for game ${appId}...`);
      const response = await this.makeRequest(
        `${this.baseUrl}/ISteamUserStats/GetPlayerAchievements/v1/?appid=${appId}&key=${this.config.apiKey}&steamid=${this.config.steamId}`
      );
      const data = await response.json();
      
      if (!data.playerstats?.achievements) {
        console.log(`No achievements available for game ${appId}`);
        return null;
      }
      
      const achievements = data.playerstats.achievements;
      return {
        achieved: achievements.filter((a: { achieved: number }) => a.achieved === 1).length,
        total: achievements.length
      };
    } catch (error) {
      console.log(`No achievements data for game ${appId}:`, error);
      return null;
    }
  }
} 