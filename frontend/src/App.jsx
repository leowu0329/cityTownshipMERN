import { useState } from 'react';
import LocationList from './components/LocationList';
import './App.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const handleRefresh = () => {
    setRefreshTrigger(prev => !prev);
  };

  return (
    <div className="app-container">
      <h1>台灣縣市鄉鎮選擇器</h1>
      <LocationList onRefresh={handleRefresh} />
    </div>
  );
}

export default App;