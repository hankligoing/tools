import 'dotenv/config';
import express from 'express';
import axios from 'axios';

const app = express();
const PORT = 3000;

// 天气 API 配置
const API_KEY = process.env.WEATHER_API_KEY;
const BASE_URL = process.env.WEATHER_API_BASE_URL || 'https://api.weatherapi.com/v1';

if (!API_KEY) {
  console.error('请在 .env 文件中配置 WEATHER_API_KEY');
  process.exit(1);
}

// 提供静态文件
app.use(express.static('.'));
app.use(express.json());

// 获取当前天气
app.get('/api/weather', async (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ error: { message: '请提供城市名称', code: 'INVALID_PARAMS' } });
  }

  try {
    const response = await axios.get(`${BASE_URL}/current.json`, {
      params: { key: API_KEY, q: city },
    });
    res.json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ error: { message: '网络请求失败', code: 'NETWORK_ERROR' } });
  }
});

app.listen(PORT, () => {
  console.log(`天气查询服务已启动: http://localhost:${PORT}`);
});