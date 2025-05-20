import { useState } from 'react';
import styles from './styles.module.css';
import { SteamIntegration } from './steamIntegration';

interface SteamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (steamGames: any[]) => void;
}

export default function SteamModal({ isOpen, onClose, onConnect }: SteamModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [steamId, setSteamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [corsEnabled, setCorsEnabled] = useState(false);

  const handleEnableCors = () => {
    window.open('https://cors-anywhere.herokuapp.com/corsdemo', '_blank');
    setCorsEnabled(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!corsEnabled) {
      setError('Please enable CORS access first by clicking the "Enable CORS Access" button above.');
      setLoading(false);
      return;
    }

    try {
      const steam = new SteamIntegration({ apiKey, steamId });
      
      // Test connection
      const isConnected = await steam.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to Steam. Please check your credentials.');
      }

      // Fetch games
      const games = await steam.getOwnedGames();
      if (!games || games.length === 0) {
        throw new Error('No games found. Make sure your Steam profile and game details are set to public in your Steam privacy settings.');
      }
      
      // Transform games into our format, excluding games with 0 playtime
      const transformedGames = await Promise.all(
        games
          .filter(game => game.playtime_forever > 0) // Only include games with playtime
          .map(async (game) => {
            const details = await steam.getGameDetails(game.appid);
            const achievements = await steam.getGameAchievements(game.appid);
            
            return {
              id: `steam-${game.appid}`,
              title: game.name,
              platform: 'Steam',
              coverUrl: details?.header_image || undefined,
              playTime: game.playtime_forever, // Already in minutes
              achievements: achievements ? {
                earned: achievements.achieved,
                total: achievements.total
              } : undefined
            };
          })
      );

      if (transformedGames.length === 0) {
        throw new Error('No games found with playtime. Only games you have played will be imported.');
      }

      onConnect(transformedGames);
      onClose();
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      
      if (errorMessage.includes('NetworkError')) {
        errorMessage = 'Network Error: Unable to connect to Steam API. Please make sure you\'ve enabled CORS access.';
      }
      
      // Add troubleshooting tips
      errorMessage += '\n\nTroubleshooting tips:';
      errorMessage += '\n1. Make sure you\'ve clicked "Enable CORS Access" above';
      errorMessage += '\n2. Verify your Steam API key is correct';
      errorMessage += '\n3. Make sure you\'re using your Steam64 ID (17-digit number)';
      errorMessage += '\n4. Check your Steam profile privacy settings:';
      errorMessage += '\n   - Set profile to Public';
      errorMessage += '\n   - Set game details to Public';
      errorMessage += '\n   - Only games with playtime will be imported';
      errorMessage += '\n5. Wait a few minutes and try again (Steam API has rate limits)';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Connect Steam Account</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.corsNotice}>
            <p>First time setup: Enable CORS access to connect to Steam</p>
            <button
              type="button"
              className={styles.corsButton}
              onClick={handleEnableCors}
            >
              {corsEnabled ? '✓ CORS Access Enabled' : 'Enable CORS Access'}
            </button>
            <small className={styles.helpText}>
              Click the button above, then click "Request temporary access to the demo server" on the new page that opens
            </small>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="apiKey">Steam API Key</label>
            <div className={styles.passwordInput}>
              <input
                type={showApiKey ? "text" : "password"}
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                placeholder="Enter your Steam API key"
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowApiKey(!showApiKey)}
                title={showApiKey ? "Hide API key" : "Show API key"}
              >
                {showApiKey ? "Hide" : "Show"}
              </button>
            </div>
            <small className={styles.helpText}>
              Get your API key from{' '}
              <a 
                href="https://steamcommunity.com/dev/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.link}
              >
                Steam Developer Portal
              </a>
              <ul className={styles.helpList}>
                <li>Log in to the Steam Developer Portal</li>
                <li>Enter any domain name (e.g., "localhost")</li>
                <li>Agree to the Steam API Terms of Use</li>
                <li>Your API key will be displayed - copy it</li>
                <li>Keep this key private and don't share it</li>
              </ul>
            </small>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="steamId">Steam ID</label>
            <input
              type="text"
              id="steamId"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              required
              placeholder="Enter your Steam ID"
            />
            <small className={styles.helpText}>
              Find your Steam ID using{' '}
              <a 
                href="https://steamid.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.link}
              >
                SteamID.io
              </a>
              <ul className={styles.helpList}>
                <li>Go to your Steam profile in a web browser</li>
                <li>Copy your profile URL (e.g., https://steamcommunity.com/id/YOURNAME)</li>
                <li>Paste it into SteamID.io</li>
                <li>Look for "Steam64 ID" - this is the number you need</li>
              </ul>
            </small>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 