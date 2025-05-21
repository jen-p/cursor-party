"use client";

// Template for creating a new prototype
// To use this template:
// 1. Create a new folder in app/prototypes with your prototype name
// 2. Copy this file and styles.module.css into your new folder
// 3. Create an 'images' folder for your prototype's images
// 4. Rename and customize the component and styles as needed

import Link from 'next/link';
import styles from './styles.module.css';
import { useState, useEffect, useMemo } from 'react';
import SteamModal from './SteamModal';

interface Game {
  id: string;
  title: string;
  platform: string;
  coverUrl?: string;
  playTime?: number;
  lastPlayed?: string;
  rating?: number;
  review?: string;
  achievements?: {
    earned: number;
    total: number;
  };
}

type SortOption = 'playTime' | 'title' | 'rating' | 'platform';

interface SortConfig {
  key: SortOption;
  direction: 'asc' | 'desc';
}

interface Filters {
  platform: string;
  minRating: number;
  searchQuery: string;
  hideUnplayed: boolean;
  showCompleted: boolean;
}

interface GameFormData {
  title: string;
  platform: string;
  coverUrl: string;
  playTime: string;
  rating: string;
  review: string;
}

export default function GameTracker() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSteamModal, setShowSteamModal] = useState(false);
  const [steamLoading, setSteamLoading] = useState(false);
  const [editingGame, setEditingGame] = useState<string | null>(null);
  const [sort, setSort] = useState<SortConfig>({ key: 'playTime', direction: 'desc' });
  const [filters, setFilters] = useState<Filters>({
    platform: '',
    minRating: 0,
    searchQuery: '',
    hideUnplayed: false,
    showCompleted: false
  });
  const [formData, setFormData] = useState<GameFormData>({
    title: '',
    platform: '',
    coverUrl: '',
    playTime: '',
    rating: '',
    review: ''
  });

  useEffect(() => {
    // Load saved games from localStorage
    const savedGames = localStorage.getItem('games');
    if (savedGames) {
      setGames(JSON.parse(savedGames));
    }
    setLoading(false);
  }, []);

  const filteredAndSortedGames = useMemo(() => {
    return [...games]
      .filter(game => {
        // Platform filter
        if (filters.platform && game.platform !== filters.platform) return false;
        
        // Rating filter
        if (filters.minRating > 0 && (!game.rating || game.rating < filters.minRating)) return false;
        
        // Search query
        if (filters.searchQuery && !game.title.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
        
        // Hide unplayed games
        if (filters.hideUnplayed && (!game.playTime || game.playTime === 0)) return false;
        
        // Show only completed games (100% achievements)
        if (filters.showCompleted && (!game.achievements || game.achievements.earned < game.achievements.total)) return false;
        
        return true;
      })
      .sort((a, b) => {
        switch (sort.key) {
          case 'playTime':
            const aTime = a.playTime || 0;
            const bTime = b.playTime || 0;
            return sort.direction === 'asc' ? aTime - bTime : bTime - aTime;
          
          case 'title':
            return sort.direction === 'asc'
              ? a.title.localeCompare(b.title)
              : b.title.localeCompare(a.title);
          
          case 'rating':
            const aRating = a.rating || 0;
            const bRating = b.rating || 0;
            return sort.direction === 'asc' ? aRating - bRating : bRating - aRating;
          
          case 'platform':
            return sort.direction === 'asc'
              ? a.platform.localeCompare(b.platform)
              : b.platform.localeCompare(a.platform);
          
          default:
            return 0;
        }
      });
  }, [games, sort, filters]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (game: Game) => {
    setEditingGame(game.id);
    setFormData({
      title: game.title,
      platform: game.platform,
      coverUrl: game.coverUrl || '',
      playTime: game.playTime ? String(game.playTime / 60) : '', // Convert minutes back to hours
      rating: game.rating ? String(game.rating) : '',
      review: game.review || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const gameData: Game = {
      id: editingGame || crypto.randomUUID(),
      title: formData.title,
      platform: formData.platform || 'Unknown',
      coverUrl: formData.coverUrl || undefined,
      playTime: formData.playTime ? parseInt(formData.playTime) * 60 : undefined, // Convert hours to minutes
      rating: formData.rating ? parseInt(formData.rating) : undefined,
      review: formData.review || undefined
    };

    let updatedGames: Game[];
    if (editingGame) {
      // Update existing game
      updatedGames = games.map(game => 
        game.id === editingGame ? gameData : game
      );
    } else {
      // Add new game
      updatedGames = [...games, gameData];
    }

    setGames(updatedGames);
    localStorage.setItem('games', JSON.stringify(updatedGames));
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGame(null);
    setFormData({
      title: '',
      platform: '',
      coverUrl: '',
      playTime: '',
      rating: '',
      review: ''
    });
  };

  const handleDelete = () => {
    if (!editingGame) return;
    
    const updatedGames = games.filter(game => game.id !== editingGame);
    setGames(updatedGames);
    localStorage.setItem('games', JSON.stringify(updatedGames));
    handleCloseModal();
  };

  const handleSteamGames = (steamGames: Game[]) => {
    setSteamLoading(true);
    // Filter out any Steam games we already have
    const existingIds = new Set(games.map(g => g.id));
    const newGames = steamGames.filter(g => !existingIds.has(g.id));
    
    // Add new games to the list
    const updatedGames = [...games, ...newGames];
    setGames(updatedGames);
    localStorage.setItem('games', JSON.stringify(updatedGames));
    setSteamLoading(false);
  };

  const handleSort = (key: SortOption) => {
    setSort(prev => ({
      key,
      direction: prev.key === key ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'desc'
    }));
  };

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <header className={styles.header}>
          <h1 className={styles.headerTitle}>Game Tracker</h1>
        </header>
      </div>

      <div className={styles.platformButtons}>
        <span className={styles.platformLabel}>Connect</span>
        <button 
          className={styles.platformButton}
          onClick={() => setShowSteamModal(true)}
          disabled={steamLoading}
        >
          {steamLoading ? 'Connecting...' : 'Steam'}
        </button>
        <button className={styles.platformButton}>PlayStation</button>
        <button className={styles.platformButton}>Xbox</button>
        <button 
          className={styles.platformButton}
          onClick={() => setShowModal(true)}
        >
          Add Manually
        </button>
      </div>

      <main className={styles.main}>
        {loading ? (
          <div className={styles.loading}>Initializing game data...</div>
        ) : (
          <>
            <div className={styles.filterControls}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Search games..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className={styles.searchInput}
                />
              </div>
              
              <div className={styles.filterOptions}>
                <select
                  value={filters.platform}
                  onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value }))}
                  className={styles.filterSelect}
                >
                  <option value="">All Platforms</option>
                  <option value="Steam">Steam</option>
                  <option value="PC">PC (Other)</option>
                  <option value="PlayStation 5">PlayStation 5</option>
                  <option value="PlayStation 4">PlayStation 4</option>
                  <option value="Xbox Series X|S">Xbox Series X|S</option>
                  <option value="Xbox One">Xbox One</option>
                  <option value="Nintendo Switch">Nintendo Switch</option>
                  <option value="Other">Other</option>
                </select>

                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                  className={styles.filterSelect}
                >
                  <option value="0">All Ratings</option>
                  <option value="5">★★★★★ Only</option>
                  <option value="4">★★★★☆ & Up</option>
                  <option value="3">★★★☆☆ & Up</option>
                  <option value="2">★★☆☆☆ & Up</option>
                  <option value="1">★☆☆☆☆ & Up</option>
                </select>

                <label className={styles.filterCheckbox}>
                  <input
                    type="checkbox"
                    checked={filters.hideUnplayed}
                    onChange={(e) => setFilters(prev => ({ ...prev, hideUnplayed: e.target.checked }))}
                  />
                  Hide Unplayed
                </label>

                <label className={styles.filterCheckbox}>
                  <input
                    type="checkbox"
                    checked={filters.showCompleted}
                    onChange={(e) => setFilters(prev => ({ ...prev, showCompleted: e.target.checked }))}
                  />
                  Show 100% Complete
                </label>
              </div>
            </div>

            <div className={styles.sortControls}>
              <span className={styles.sortLabel}>Sort by:</span>
              <button
                className={`${styles.sortButton} ${sort.key === 'playTime' ? styles.active : ''}`}
                onClick={() => handleSort('playTime')}
              >
                Hours Played {sort.key === 'playTime' && (sort.direction === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`${styles.sortButton} ${sort.key === 'title' ? styles.active : ''}`}
                onClick={() => handleSort('title')}
              >
                Title {sort.key === 'title' && (sort.direction === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`${styles.sortButton} ${sort.key === 'rating' ? styles.active : ''}`}
                onClick={() => handleSort('rating')}
              >
                Rating {sort.key === 'rating' && (sort.direction === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`${styles.sortButton} ${sort.key === 'platform' ? styles.active : ''}`}
                onClick={() => handleSort('platform')}
              >
                Platform {sort.key === 'platform' && (sort.direction === 'asc' ? '↑' : '↓')}
              </button>
            </div>

            <div className={styles.gameGrid}>
              {filteredAndSortedGames.length === 0 ? (
                <div className={styles.emptyState}>
                  <h2>No games match your filters</h2>
                  <p>Try adjusting your search criteria or filters to see more games</p>
                </div>
              ) : (
                filteredAndSortedGames.map((game) => (
                  <div key={game.id} className={styles.gameCard}>
                    <button 
                      className={styles.editButton}
                      onClick={() => handleEdit(game)}
                      title="Edit game"
                    >
                      ✎
                    </button>
                    <div className={styles.gameCover}>
                      {game.coverUrl ? (
                        <img src={game.coverUrl} alt={game.title} />
                      ) : (
                        <div className={styles.placeholderCover}></div>
                      )}
                    </div>
                    <div className={styles.gameInfo}>
                      <h3>{game.title}</h3>
                      <p className={styles.platform}>{game.platform}</p>
                      {game.playTime && (
                        <p className={styles.playTime}>
                          {Math.floor(game.playTime / 60)} hours played
                        </p>
                      )}
                      {game.achievements && (
                        <p className={styles.achievements}>
                          {game.achievements.earned}/{game.achievements.total} achievements
                        </p>
                      )}
                      {game.rating && (
                        <div className={styles.rating}>
                          {"★".repeat(game.rating)}{"☆".repeat(5 - game.rating)}
                        </div>
                      )}
                      {game.review && (
                        <p className={styles.review}>{game.review}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingGame ? 'Edit Game' : 'Add New Game'}</h2>
              <button 
                className={styles.closeButton}
                onClick={handleCloseModal}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="title">Game Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="platform">Platform</label>
                <select
                  id="platform"
                  name="platform"
                  value={formData.platform}
                  onChange={handleInputChange}
                  required={!editingGame}
                >
                  <option value="">Select Platform</option>
                  <option value="Steam">Steam</option>
                  <option value="PC">PC (Other)</option>
                  <option value="PlayStation 5">PlayStation 5</option>
                  <option value="PlayStation 4">PlayStation 4</option>
                  <option value="Xbox Series X|S">Xbox Series X|S</option>
                  <option value="Xbox One">Xbox One</option>
                  <option value="Nintendo Switch">Nintendo Switch</option>
                  <option value="Other">Other</option>
                  {editingGame && <option value="Unknown">Unknown</option>}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="coverUrl">Cover Image URL</label>
                <input
                  type="url"
                  id="coverUrl"
                  name="coverUrl"
                  value={formData.coverUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="playTime">Hours Played</label>
                <input
                  type="number"
                  id="playTime"
                  name="playTime"
                  value={formData.playTime}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                  placeholder="0.0"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="rating">Rating</label>
                <select
                  id="rating"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                >
                  <option value="">Select Rating</option>
                  <option value="5">★★★★★ Masterpiece</option>
                  <option value="4">★★★★☆ Great</option>
                  <option value="3">★★★☆☆ Good</option>
                  <option value="2">★★☆☆☆ Okay</option>
                  <option value="1">★☆☆☆☆ Poor</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="review">Review/Notes</label>
                <textarea
                  id="review"
                  name="review"
                  value={formData.review}
                  onChange={handleInputChange}
                  placeholder="Write your thoughts about the game..."
                  rows={4}
                />
              </div>

              <div className={styles.formActions}>
                <div className={styles.formActionsLeft}>
                  {editingGame && (
                    <button 
                      type="button" 
                      className={styles.deleteButton}
                      onClick={handleDelete}
                    >
                      Delete Game
                    </button>
                  )}
                </div>
                <div className={styles.formActionsRight}>
                  <button 
                    type="button" 
                    className={styles.cancelButton}
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitButton}>
                    {editingGame ? 'Save Changes' : 'Add Game'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <SteamModal
        isOpen={showSteamModal}
        onClose={() => setShowSteamModal(false)}
        onConnect={handleSteamGames}
      />
    </div>
  );
} 