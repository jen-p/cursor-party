"use client";

// Template for creating a new prototype
// To use this template:
// 1. Create a new folder in app/prototypes with your prototype name
// 2. Copy this file and styles.module.css into your new folder
// 3. Create an 'images' folder for your prototype's images
// 4. Rename and customize the component and styles as needed

import Link from 'next/link';
import styles from './styles.module.css';
import { useState, useEffect } from 'react';

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
  const [editingGame, setEditingGame] = useState<string | null>(null);
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
      platform: formData.platform,
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

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <header className={styles.header}>
          <h1 className={styles.headerTitle}>Game Tracker</h1>
        </header>
      </div>

      <div className={styles.platformButtons}>
        <span className={styles.platformLabel}>Connect</span>
        <button className={styles.platformButton}>Steam</button>
        <button className={styles.platformButton}>PlayStation</button>
        <button className={styles.platformButton}>Xbox</button>
        <button className={styles.platformButton}>Switch</button>
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
          <div className={styles.gameGrid}>
            {games.length === 0 ? (
              <div className={styles.emptyState}>
                <h2>No games in database</h2>
                <p>Connect your gaming accounts or add games manually to start tracking your collection</p>
              </div>
            ) : (
              games.map((game) => (
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
                  required
                >
                  <option value="">Select Platform</option>
                  <option value="PC">PC</option>
                  <option value="PlayStation 5">PlayStation 5</option>
                  <option value="PlayStation 4">PlayStation 4</option>
                  <option value="Xbox Series X|S">Xbox Series X|S</option>
                  <option value="Xbox One">Xbox One</option>
                  <option value="Nintendo Switch">Nintendo Switch</option>
                  <option value="Other">Other</option>
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 