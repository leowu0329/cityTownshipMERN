import { useState, useEffect, useCallback } from 'react';
import CityTownship from './cityTownship';
import Modal from './Modal';

const LocationList = ({ onRefresh }) => {
  const [locations, setLocations] = useState([]);
  const [editingLocation, setEditingLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 載入所有記錄
  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3001/api/locations');
      if (!response.ok) {
        throw new Error('無法載入記錄');
      }
      const data = await response.json();
      setLocations(data);
    } catch (err) {
      console.error('載入記錄失敗:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations, onRefresh]);

  // 處理新增記錄
  const handleAddNew = useCallback(async (newData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newData),
      });

      if (!response.ok) {
        throw new Error('新增失敗');
      }

      setIsAddModalOpen(false);
      fetchLocations();
    } catch (err) {
      console.error('新增記錄失敗:', err);
      setError(err.message);
    }
  }, [fetchLocations]);

  // 處理刪除
  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('確定要刪除此記錄嗎？')) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/locations/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('刪除失敗');
      }
      
      fetchLocations();
    } catch (err) {
      console.error('刪除記錄失敗:', err);
      setError(err.message);
    }
  }, [fetchLocations]);

  // 開啟編輯 Modal
  const handleEditClick = useCallback((location) => {
    setEditingLocation(location);
    setIsEditModalOpen(true);
  }, []);

  // 處理更新提交
  const handleUpdateSubmit = useCallback(async (updatedData) => {
    try {
      const response = await fetch(`http://localhost:3001/api/locations/${editingLocation._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        throw new Error('更新失敗');
      }
      
      setIsEditModalOpen(false);
      fetchLocations();
    } catch (err) {
      console.error('更新記錄失敗:', err);
      setError(err.message);
    }
  }, [editingLocation, fetchLocations]);

  return (
    <div className="location-list">
      <div className="location-list-header">
        <h2>已儲存的縣市鄉鎮記錄</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="add-new-button"
        >
          ＋ 新增記錄
        </button>
      </div>

      {/* 新增記錄 Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <LocationForm 
          title="新增縣市鄉鎮記錄"
          onSubmit={handleAddNew}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* 編輯記錄 Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        {editingLocation && (
          <LocationForm 
            title="編輯縣市鄉鎮記錄"
            initialCity={editingLocation.cityId}
            initialTownship={editingLocation.townshipId}
            onSubmit={handleUpdateSubmit}
            onCancel={() => setIsEditModalOpen(false)}
          />
        )}
      </Modal>

      {isLoading && locations.length === 0 ? (
        <div className="loading-message">載入中...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : locations.length === 0 ? (
        <p className="no-records-message">目前沒有記錄</p>
      ) : (
        <ul className="location-items">
          {locations.map(location => (
            <li key={location._id} className="location-item">
              <div className="location-info">
                <span className="location-text">
                  {location.cityName} - {location.townshipName}
                </span>
                <small className="location-time">
                  {new Date(location.createdAt).toLocaleString()}
                </small>
              </div>
              <div className="location-actions">
                <button 
                  onClick={() => handleEditClick(location)}
                  className="edit-button"
                >
                  編輯
                </button>
                <button 
                  onClick={() => handleDelete(location._id)}
                  className="delete-button"
                >
                  刪除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// 共用表單組件
const LocationForm = ({ title, initialCity = '', initialTownship = '', onSubmit, onCancel }) => {
  const [selection, setSelection] = useState({
    city: initialCity,
    township: initialTownship
  });

  const handleSelectionChange = useCallback((newSelection) => {
    setSelection(newSelection);
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!selection.city || !selection.township) {
      alert('請選擇完整的縣市和鄉鎮區');
      return;
    }
    onSubmit({
      cityId: selection.city,
      townshipId: selection.township
    });
  }, [onSubmit, selection.city, selection.township]);

  return (
    <form onSubmit={handleSubmit} className="location-form">
      <h3>{title}</h3>
      <CityTownship 
        onSelectionChange={handleSelectionChange}
        initialCity={initialCity}
        initialTownship={initialTownship}
      />
      <div className="form-actions">
        <button type="submit" className="submit-button">儲存</button>
        <button type="button" onClick={onCancel} className="cancel-button">取消</button>
      </div>
    </form>
  );
};

export default LocationList;