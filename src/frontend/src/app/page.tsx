'use client';

import { DiscoverSection } from '../components/song/discover-section';
import { ExploreGenre } from '../components/song/explore-genre';
import { TrendingSection } from '../components/song/trending-section';
import { AuthWrapper } from '../components/auth/auth-wrapper';
import { WelcomePopup } from '../components/common/welcome-popup';
import { useAuthStore } from '../store/auth-store';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function Home() {
  const { user, isAuthenticated, isNewAccount, clearNewAccountFlag } = useAuthStore();

  return (
    <AuthWrapper>
      <div className="p-4 space-y-4">
        {/* Discover New Music Section */}
        <DiscoverSection />

        {/* Explore Genre Section */}
        <ExploreGenre />

        {/* Trending Now Section */}
        <TrendingSection />
      </div>

      {/* Welcome Popup only for new accounts */}
      {isAuthenticated && user && isNewAccount && (
        <WelcomePopup 
          username={user.username} 
          onClose={clearNewAccountFlag}
        />
      )}
    </AuthWrapper>
  );
}
