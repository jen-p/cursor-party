import Link from "next/link";
import styles from './styles/home.module.css';
import { instrumentSans } from './fonts';

export default function Home() {
  // First column of prototypes
  const leftColumnPrototypes = [
    {
      title: 'Getting started',
      description: 'How to create a prototype',
      path: '/prototypes/example'
    },
    {
      title: 'Confetti button',
      description: 'An interactive button that creates a colorful confetti explosion',
      path: '/prototypes/confetti-button'
    },
    {
      title: 'Digital Piano',
      description: 'An interactive piano keyboard with multiple sound options and keyboard controls',
      path: '/prototypes/digital-synth'
    },
  ];

  // Second column of prototypes
  const rightColumnPrototypes = [
    {
      title: "Captain's Log",
      description: 'A retro-futuristic note-taking app inspired by Star Trek and classic operating systems',
      path: '/prototypes/captains-log'
    },
    {
      title: 'My Bookshelf',
      description: 'A Notion-powered reading tracker that displays your books in a beautiful gallery format',
      path: '/prototypes/my-bookshelf'
    },
    {
      title: 'Contact Form',
      description: 'A modern, responsive contact form with clean design and smooth interactions',
      path: '/prototypes/form'
    },
  ];

  return (
    <div className={`${styles.container} ${instrumentSans.className}`}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Jen's prototypes</h1>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.columnContainer}>
          <div className={styles.column}>
            <div className={styles.grid}>
              {leftColumnPrototypes.map((prototype, index) => (
                <Link 
                  key={index}
                  href={prototype.path} 
                  className={styles.card}
                >
                  <h3 className={styles.cardTitle}>{prototype.title}</h3>
                  <p className={styles.cardDescription}>{prototype.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.column}>
            <div className={styles.grid}>
              {rightColumnPrototypes.map((prototype, index) => (
                <Link 
                  key={index}
                  href={prototype.path} 
                  className={styles.card}
                >
                  <h3 className={styles.cardTitle}>{prototype.title}</h3>
                  <p className={styles.cardDescription}>{prototype.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
