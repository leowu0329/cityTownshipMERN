import { useState, useEffect } from 'react';

const CityTownship = ({ onSelectionChange, initialCity = '', initialTownship = '' }) => {
  const [cities, setCities] = useState([]);
  const [townships, setTownships] = useState([]);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedTownship, setSelectedTownship] = useState(initialTownship);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 載入縣市資料
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const [citiesRes, townshipsRes] = await Promise.all([
          fetch('/city.json'),
          fetch('/township.json')
        ]);
        
        // 檢查回應狀態
        if (!citiesRes.ok) throw new Error(`載入縣市資料失敗: ${citiesRes.status}`);
        if (!townshipsRes.ok) throw new Error(`載入鄉鎮資料失敗: ${townshipsRes.status}`);
        
        const [citiesData, townshipsData] = await Promise.all([
          citiesRes.json(),
          townshipsRes.json()
        ]);
        
        setCities(citiesData);
        
        // 如果有初始城市值，載入對應的鄉鎮
        if (initialCity && townshipsData[initialCity]) {
          setTownships(townshipsData[initialCity]);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('載入資料失敗:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [initialCity]);

  // 當選擇的縣市變更時，更新鄉鎮選項
  useEffect(() => {
    const fetchTownships = async () => {
      if (!selectedCity) {
        setTownships([]);
        setSelectedTownship('');
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch('/township.json');
        if (!response.ok) throw new Error(`載入鄉鎮資料失敗: ${response.status}`);
        
        const data = await response.json();
        const cityTownships = data[selectedCity] || [];
        setTownships(cityTownships);
        
        // 如果當前選擇的鄉鎮不在新縣市的選項中，清空選擇
        if (selectedTownship && !cityTownships.some(t => t.id === selectedTownship)) {
          setSelectedTownship('');
        }
      } catch (err) {
        console.error('載入鄉鎮資料失敗:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTownships();
  }, [selectedCity, selectedTownship]);

  // 當選擇變更時通知父組件
  useEffect(() => {
    onSelectionChange?.({
      city: selectedCity,
      township: selectedTownship
    });
  }, [selectedCity, selectedTownship, onSelectionChange]);

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
  };

  const handleTownshipChange = (e) => {
    setSelectedTownship(e.target.value);
  };

  if (error) {
    return (
      <div className="error-message">
        <p>載入資料時發生錯誤</p>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>重新載入</button>
      </div>
    );
  }

  return (
    <div className="city-township-selector">
      <div className="form-group">
        <label htmlFor="city">縣市</label>
        <select 
          id="city" 
          value={selectedCity} 
          onChange={handleCityChange}
          className="form-control"
          disabled={isLoading}
        >
          <option value="">請選擇縣市</option>
          {cities.map(city => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="township">鄉鎮區</label>
        <select 
          id="township" 
          value={selectedTownship} 
          onChange={handleTownshipChange}
          className="form-control"
          disabled={!selectedCity || isLoading}
        >
          <option value="">{townships.length ? '請選擇鄉鎮區' : '請先選擇縣市'}</option>
          {townships.map(township => (
            <option key={township.id} value={township.id}>
              {township.name}
            </option>
          ))}
        </select>
      </div>
      {isLoading && <div className="loading-indicator">載入中...</div>}
    </div>
  );
};

export default CityTownship;