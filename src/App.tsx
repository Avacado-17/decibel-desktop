import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import LibraryScreen from './screens/LibraryScreen';
import PlayerScreen from './screens/PlayerScreen';
import YouTubePlayer from './components/YouTubePlayer';

function App() {
  return (
    <>
      <YouTubePlayer />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomeScreen />} />
          <Route path="search" element={<SearchScreen />} />
          <Route path="library" element={<LibraryScreen />} />
          <Route path="player" element={<PlayerScreen />} />
        </Route>
        <Route path="/player" element={<PlayerScreen />} />
      </Routes>
    </>
  );
}

export default App;
