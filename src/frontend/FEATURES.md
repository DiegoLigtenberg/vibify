# VIBIFY - Frontend Features Specification

## 🎯 **Target Users**
- **Primary**: Music Listeners (discovery, search, playlists)
- **Secondary**: Music Creators (upload, manage content)

## 🏠 **MAIN SCREEN (Home Dashboard)**

### **Header Section**
- **Navigation**: Back/Forward buttons (browser-style)
- **Search Bar**: Prominent center search with dark theme
- **User Actions**: Sign up/Log in buttons

### **Welcome Section**
- **Greeting**: "Good evening" personalized message
- **Quick Access Cards**:
  - **Liked Songs** (heart icon, song count)
  - **Recently Played** (clock icon, song count) 
  - **Create Playlist** (plus icon, "New playlist")

### **Discover New Music Section**
- **Layout**: 6 songs in horizontal grid
- **Navigation**: Left/Right pagination arrows
- **Actions**: "Show all" button → goes to genre page
- **Song Cards**: Thumbnail, title, artist, play button, like button
- **Functionality**: Click arrows to load new random songs

### **Explore by Genre Section**
- **Layout**: 4 genre cards (Pop, Rock, Electronic, Jazz)
- **Navigation**: Left/Right scroll arrows to browse genres
- **Genre Cards**: Icon, name, description, clickable
- **Actions**: Click genre → view all songs of that genre
- **"Show all" button**: Auto-navigates to genre page

### **Sidebar Navigation**
- **Main Nav**: Home, Search
- **Playlists Section**:
  - **Liked Songs** (heart icon, count)
  - **Recently Played** (clock icon, count)
  - **Create Playlist** button (+ icon)
- **Creator Section** (below playlists):
  - **Upload Music** button (upload icon)
- **User Profile**: Avatar, name, plan status

## 🔍 **SEARCH PAGE**

### **Search Interface**
- **Large Search Bar**: Prominent search input
- **Recent Searches**: Quick access to previous searches
- **Popular Searches**: Trending search terms

### **Search Results**
- **Tabs**: Songs, Artists, Albums, Playlists
- **Song Results**: Thumbnail, title, artist, album, play button, like button
- **Artist Results**: Avatar, name, follower count, play button
- **Album Results**: Cover art, title, artist, year, play button
- **Playlist Results**: Cover, name, creator, song count, play button

### **Filters & Sorting**
- **Genre Filter**: Dropdown with all available genres
- **Year Filter**: Range slider or dropdown
- **Duration Filter**: Short (< 3min), Medium (3-7min), Long (> 7min)
- **Sort Options**: Relevance, Date Added, Popularity, Duration

## 🎵 **GENRE PAGE**

### **Genre Header**
- **Genre Name**: Large title with icon
- **Description**: Genre description and characteristics
- **Song Count**: Total songs in this genre
- **Play All Button**: Play all songs in genre

### **Genre Navigation**
- **Genre Dropdown**: Switch between different genres
- **Current Genre**: Highlighted in dropdown
- **Quick Genre Tabs**: Popular genres as tabs

### **Song Grid**
- **Layout**: Grid of song cards (6-12 per row)
- **Song Cards**: Thumbnail, title, artist, album, duration, play button, like button
- **Pagination**: Load more songs, infinite scroll
- **Sorting**: By popularity, date, duration, alphabetical

## 📋 **PLAYLIST PAGE**

### **Playlist Header**
- **Playlist Info**: Name, description, creator, song count
- **Actions**: Play button, Like button, Share button
- **Edit Mode**: Toggle edit mode for playlist owner

### **Track List**
- **Song List**: Numbered list with song details
- **Song Info**: Title, artist, album, duration
- **Actions**: Play button, Remove button, Move up/down
- **Drag & Drop**: Reorder songs by dragging

### **Add Songs**
- **Search Songs**: Search and add songs to playlist
- **Browse by Genre**: Add songs from specific genres
- **Recent Songs**: Quick add from recently played

## 🎵 **ALBUM PAGE**

### **Album Header**
- **Album Art**: Large cover image
- **Album Info**: Title, artist, release date, genre
- **Actions**: Play button, Like button, Add to playlist
- **Stats**: Song count, total duration

### **Track List**
- **Song List**: Numbered tracks with details
- **Song Info**: Track number, title, duration, play button, like button
- **Actions**: Play individual songs, add to playlist

## ⬆️ **UPLOAD PAGE**

### **Upload Interface**
- **Drag & Drop Area**: Large drop zone for audio files
- **File Selection**: Browse and select multiple files
- **Progress Bars**: Individual file upload progress
- **Supported Formats**: MP3, WAV, FLAC, M4A, AAC

### **Metadata Form**
- **Song Details**: Title, artist, album, genre
- **Release Info**: Release date, label
- **Thumbnail Upload**: Album art or custom image
- **Description**: Optional song description

### **Upload Management**
- **Upload Queue**: Manage multiple uploads
- **Edit Metadata**: Modify song information
- **Preview**: Listen to uploaded songs
- **Submit**: Finalize and publish songs

## 🎧 **PLAYER FUNCTIONALITY**

### **Player Bar (Bottom)**
- **Current Song**: Thumbnail, title, artist
- **Controls**: Play/pause, previous, next, shuffle, repeat
- **Progress**: Seek bar with time display
- **Volume**: Volume slider with mute
- **Queue**: View and manage song queue

### **Playback Features**
- **Auto-play**: Continue to next song
- **Shuffle**: Random song order
- **Repeat**: Repeat one song or entire queue
- **Crossfade**: Smooth transitions between songs

## 🔄 **USER INTERACTIONS**

### **Primary User Flows**

1. **Discovery Flow**:
   - Home → Browse genres → Play song → Add to playlist

2. **Search Flow**:
   - Home → Search → Results → Play song → Like/Add to playlist

3. **Playlist Management**:
   - Home → Create playlist → Add songs → Organize → Play

4. **Upload Flow**:
   - Home → Upload → Fill metadata → Submit → Review

5. **Genre Exploration**:
   - Home → Genre section → Scroll genres → Select genre → Browse songs

### **Key Interactions**

1. **Play Music**:
   - Click play button → Song starts
   - Player bar appears at bottom
   - Queue management

2. **Like Songs**:
   - Heart button → Song added to liked
   - Visual feedback with animation

3. **Add to Playlist**:
   - Right-click song → "Add to playlist"
   - Select playlist → Confirmation

4. **Create Playlist**:
   - Click "Create Playlist" → Name input → Create
   - Add songs to new playlist

5. **Genre Navigation**:
   - Scroll through genres with arrows
   - Click genre → View all songs
   - Use dropdown to switch genres

## 📱 **RESPONSIVE DESIGN**

### **Mobile Layout**
- **Sidebar**: Collapsible hamburger menu
- **Search**: Full-width search bar
- **Song Grid**: 2-3 columns on mobile
- **Player**: Simplified controls

### **Tablet Layout**
- **Sidebar**: Always visible
- **Song Grid**: 4-6 columns
- **Player**: Full controls visible

### **Desktop Layout**
- **Sidebar**: Fixed width
- **Song Grid**: 6-8 columns
- **Player**: Full feature set

## 🎨 **VISUAL DESIGN**

### **Color Scheme**
- **Primary**: Spotify Green (#1DB954)
- **Background**: Dark (#191414)
- **Cards**: Light Gray (#282828)
- **Text**: White (#FFFFFF)
- **Muted**: Gray (#B3B3B3)

### **Typography**
- **Headers**: Bold, large text
- **Body**: Regular weight
- **Captions**: Small, muted text

### **Animations**
- **Hover Effects**: Scale, color transitions
- **Loading States**: Skeleton screens, spinners
- **Transitions**: Smooth page transitions

## 🔧 **TECHNICAL REQUIREMENTS**

### **Performance**
- **Lazy Loading**: Load images and content on demand
- **Caching**: Cache frequently accessed data
- **Optimization**: Compress images and audio

### **Accessibility**
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels
- **Color Contrast**: WCAG compliant colors

### **Browser Support**
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Chrome Mobile
- **Progressive Enhancement**: Works without JavaScript

## 📋 **IMPLEMENTATION PRIORITY**

### **Phase 1 (Core)**
1. **Main Screen**: Discover, genres, search
2. **Player**: Basic playback functionality
3. **Search**: Basic search and results

### **Phase 2 (Enhanced)**
1. **Playlists**: Create and manage playlists
2. **Albums**: Album pages and track listings
3. **Upload**: Basic upload functionality

### **Phase 3 (Advanced)**
1. **User Authentication**: Sign up/login
2. **Social Features**: Sharing, following
3. **Recommendations**: Personalized content

## 🎯 **SUCCESS METRICS**

### **User Engagement**
- **Time on Site**: Average session duration
- **Songs Played**: Number of songs played per session
- **Playlists Created**: User-generated content

### **Content Discovery**
- **Search Usage**: Search queries per session
- **Genre Exploration**: Genre page visits
- **Random Discovery**: Songs discovered through random feed

### **Creator Features**
- **Uploads**: Number of songs uploaded
- **Metadata Quality**: Completion of song information
- **User Retention**: Return visits after upload

---

*This document serves as the comprehensive feature specification for Vibify's frontend development. It should be updated as features are implemented and new requirements are discovered.*
