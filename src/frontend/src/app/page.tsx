'use client';

import { DiscoverSection } from '../components/song/discover-section';

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import { ExploreGenre } from '../components/song/explore-genre';
import { TrendingSection } from '../components/song/trending-section';

export default function Home() {
  return (
    <div className="p-4 space-y-4">
      {/* Discover New Music Section */}
      <DiscoverSection />

      {/* Explore Genre Section */}
      <ExploreGenre />

      {/* Trending Now Section */}
      <TrendingSection />
    </div>
  );
}
