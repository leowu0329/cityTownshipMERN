require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// 連接 MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// 定義資料模型
const locationSchema = new mongoose.Schema({
  cityId: String,
  cityName: String,
  townshipId: String,
  townshipName: String,
  fullAddress: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Location = mongoose.model('Location', locationSchema);

// 中間件
app.use(cors());
app.use(express.json());

// 更新 API 路由
app.post('/api/locations', async (req, res) => {
  try {
    const { cityId, townshipId } = req.body;
    
    if (!cityId || !townshipId) {
      return res.status(400).json({ error: 'City and township IDs are required' });
    }

    // 這裡應該從資料庫或前端取得完整的縣市鄉鎮名稱
    // 這只是示例，實際應用中應該有更好的方式處理
    const cityResponse = await fetch('http://localhost:5173/city.json');
    const cities = await cityResponse.json();
    const city = cities.find(c => c.id === cityId);
    
    const townshipResponse = await fetch('http://localhost:5173/township.json');
    const townshipsData = await townshipResponse.json();
    const township = townshipsData[cityId]?.find(t => t.id === townshipId);

    const newLocation = new Location({
      cityId,
      cityName: city?.name || '未知縣市',
      townshipId,
      townshipName: township?.name || '未知鄉鎮',
      fullAddress: `${city?.name || ''}${township?.name || ''}`
    });

    await newLocation.save();

    res.status(201).json({ 
      message: 'Location saved successfully', 
      data: newLocation 
    });
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 新增 GET 所有記錄的 API
app.get('/api/locations', async (req, res) => {
  try {
    const locations = await Location.find().sort({ createdAt: -1 });
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 新增 GET 單一記錄的 API
app.get('/api/locations/:id', async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 新增 PUT 更新記錄的 API
app.put('/api/locations/:id', async (req, res) => {
  try {
    const { cityId, townshipId } = req.body;
    
    if (!cityId || !townshipId) {
      return res.status(400).json({ error: 'City and township IDs are required' });
    }

    // 取得縣市和鄉鎮名稱
    const cityResponse = await fetch('http://localhost:5173/city.json');
    const cities = await cityResponse.json();
    const city = cities.find(c => c.id === cityId);
    
    const townshipResponse = await fetch('http://localhost:5173/township.json');
    const townshipsData = await townshipResponse.json();
    const township = townshipsData[cityId]?.find(t => t.id === townshipId);

    const updatedLocation = await Location.findByIdAndUpdate(
      req.params.id,
      {
        cityId,
        cityName: city?.name || '未知縣市',
        townshipId,
        townshipName: township?.name || '未知鄉鎮',
        fullAddress: `${city?.name || ''}${township?.name || ''}`,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!updatedLocation) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({ 
      message: 'Location updated successfully', 
      data: updatedLocation 
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 新增 DELETE 刪除記錄的 API
app.delete('/api/locations/:id', async (req, res) => {
  try {
    const deletedLocation = await Location.findByIdAndDelete(req.params.id);
    if (!deletedLocation) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 啟動伺服器
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});