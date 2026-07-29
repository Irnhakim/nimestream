'use client';

import { useEffect } from 'react';

export default function WatchHistoryTracker({ animeTitle, episodeTitle, slug, thumb, source = 'Otakudesu' }) {
  useEffect(() => {
    if (!animeTitle || !slug) return;

    try {
      // Load existing history
      const historyStr = localStorage.getItem('ns_watch_history');
      let history = historyStr ? JSON.parse(historyStr) : [];

      if (!Array.isArray(history)) {
        history = [];
      }

      // Filter out duplicate entries of the same anime to update it to the newest episode
      history = history.filter(item => {
        // Match either by slug or clean anime title
        const cleanItemTitle = item.animeTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanTargetTitle = animeTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
        return item.slug !== slug && cleanItemTitle !== cleanTargetTitle;
      });

      // Add new entry to the top
      history.unshift({
        animeTitle,
        episodeTitle,
        slug,
        thumb,
        source,
        watchedAt: new Date().toISOString()
      });

      // Limit watch history to 24 items
      const limitedHistory = history.slice(0, 24);

      localStorage.setItem('ns_watch_history', JSON.stringify(limitedHistory));
    } catch (e) {
      console.error('Failed to save watch history:', e);
    }
  }, [animeTitle, episodeTitle, slug, thumb, source]);

  return null; // Invisible component
}
