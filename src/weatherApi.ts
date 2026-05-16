import axios, { AxiosError } from 'axios';

// API 配置：从环境变量读取
const API_KEY = process.env.WEATHER_API_KEY;
const BASE_URL = process.env.WEATHER_API_BASE_URL || 'https://api.weatherapi.com/v1';

// 类型定义
export interface WeatherCondition {
  text: string;
  icon: string;
  code: number;
}

export interface CurrentWeather {
  last_updated: string;
  temp_c: number;
  temp_f: number;
  is_day: number;
  condition: WeatherCondition;
  wind_kph: number;
  wind_mph: number;
  wind_dir: string;
  humidity: number;
  cloud: number;
  feelslike_c: number;
  feelslike_f: number;
  uv: number;
}

export interface Location {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  localtime: string;
}

export interface ForecastDay {
  date: string;
  date_epoch: number;
  day: {
    maxtemp_c: number;
    mintemp_c: number;
    avgtemp_c: number;
    maxwind_kph: number;
    totalprecip_mm: number;
    avgvis_km: number;
    avghumidity: number;
    daily_chance_of_rain: number;
    condition: WeatherCondition;
    uv: number;
  };
  astro: {
    sunrise: string;
    sunset: string;
    moonrise: string;
    moonset: string;
    moon_phase: string;
  };
}

export interface ForecastWeather {
  location: Location;
  current: CurrentWeather;
  forecast: {
    forecastday: ForecastDay[];
  };
}

export interface CurrentWeatherResponse {
  location: Location;
  current: CurrentWeather;
}

// 位置参数：支持城市名称或经纬度
export interface LocationParams {
  query: string;
}

// 自定义错误类
export class WeatherApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'WeatherApiError';
  }
}

// 验证 API 配置
function validateConfig(): void {
  if (!API_KEY) {
    throw new WeatherApiError(
      'API Key 未配置。请设置 WEATHER_API_KEY 环境变量。',
      'MISSING_API_KEY'
    );
  }
}

// 创建 Axios 实例
const weatherApiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  params: {
    key: API_KEY,
  },
});

// 错误处理辅助函数
function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error: { message: string; code: string } }>;

    if (axiosError.response) {
      const apiError = axiosError.response.data?.error;
      throw new WeatherApiError(
        apiError?.message || `API 错误: ${axiosError.response.status}`,
        apiError?.code || 'API_ERROR',
        axiosError.response.status
      );
    }

    if (axiosError.request) {
      throw new WeatherApiError(
        '网络请求失败，请检查网络连接。',
        'NETWORK_ERROR'
      );
    }
  }

  throw new WeatherApiError(
    error instanceof Error ? error.message : '未知错误',
    'UNKNOWN_ERROR'
  );
}

/**
 * 获取当前天气
 * @param params - 位置参数，支持城市名称（如 "北京"）或经纬度（如 "39.9,116.4"）
 * @returns 当前天气数据
 */
export async function getCurrentWeather(params: LocationParams): Promise<CurrentWeatherResponse> {
  validateConfig();

  if (!params.query || params.query.trim() === '') {
    throw new WeatherApiError('查询参数不能为空', 'INVALID_PARAMS');
  }

  try {
    const response = await weatherApiClient.get<CurrentWeatherResponse>('/current.json', {
      params: { q: params.query.trim() },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * 获取天气预报
 * @param params - 位置参数，支持城市名称或经纬度
 * @param days - 预报天数 (1-10)
 * @returns 天气预报数据
 */
export async function getForecast(params: LocationParams, days: number = 3): Promise<ForecastWeather> {
  validateConfig();

  if (!params.query || params.query.trim() === '') {
    throw new WeatherApiError('查询参数不能为空', 'INVALID_PARAMS');
  }

  if (days < 1 || days > 10) {
    throw new WeatherApiError('预报天数必须在 1-10 之间', 'INVALID_DAYS');
  }

  try {
    const response = await weatherApiClient.get<ForecastWeather>('/forecast.json', {
      params: {
        q: params.query.trim(),
        days,
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// 导出类型供外部使用
export type { LocationParams as QueryParams };