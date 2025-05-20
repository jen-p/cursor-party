'use client';

import { useState, useEffect } from 'react';
import styles from './styles.module.css';

interface Book {
  id: string;
  properties: {
    Title: { title: { plain_text: string }[] };
    Author: { rich_text: { plain_text: string }[] };
    Genre: { select: { name: string } };
    'Cover Image': { files: { file?: { url: string }, external?: { url: string } }[] };
    Rating: { number: number };
    Review: { rich_text: { plain_text: string }[] };
  };
}

export default function MyBookshelf() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        console.log('Attempting to fetch books...');
        const response = await fetch('/api/books');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Response:', errorText);
          throw new Error(`Failed to fetch books: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        setBooks(data.results);
      } catch (err) {
        console.error('Error details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load books');
        setDebugInfo(JSON.stringify(err, null, 2));
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (loading) {
    return <div className={styles.container}>Loading your bookshelf...</div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Error Loading Books</h1>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>Error: {error}</p>
          {debugInfo && (
            <pre className={styles.debugInfo}>
              Debug Information:
              {debugInfo}
            </pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Bookshelf</h1>
      <div className={styles.grid}>
        {books.map((book) => (
          <div key={book.id} className={styles.book}>
            <div className={styles.coverContainer}>
              {book.properties['Cover Image'].files[0] && (
                <img
                  src={book.properties['Cover Image'].files[0].file?.url || 
                       book.properties['Cover Image'].files[0].external?.url}
                  alt={book.properties.Title.title[0].plain_text}
                  className={styles.cover}
                />
              )}
            </div>
            <div className={styles.details}>
              <h2 className={styles.bookTitle}>
                {book.properties.Title.title[0].plain_text}
              </h2>
              <p className={styles.author}>
                by {book.properties.Author.rich_text[0].plain_text}
              </p>
              <div className={styles.metadata}>
                <span className={styles.genre}>
                  {book.properties.Genre.select.name}
                </span>
                <span className={styles.rating}>
                  {'★'.repeat(book.properties.Rating.number)}
                  {'☆'.repeat(5 - book.properties.Rating.number)}
                </span>
              </div>
              {book.properties.Review.rich_text[0] && (
                <p className={styles.review}>
                  {book.properties.Review.rich_text[0].plain_text}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 