const apiKey = 'YOUR_API_KEY'; // Replace with your actual API key
const weatherApiUrl = 'https://api.openweathermap.org/data/2.5/weather';

async function fetchWeather(location) {
    try {
        const response = await fetch(`${weatherApiUrl}?q=${location}&appid=${apiKey}&units=metric`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        displayWeather(data);
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

function displayWeather(data) {
    const weatherContainer = document.getElementById('weather');
    const temperature = data.main.temp;
    const description = data.weather[0].description;
    weatherContainer.innerHTML = `
        <h2>Weather in ${data.name}</h2>
        <p>Temperature: ${temperature}°C</p>
        <p>Description: ${description}</p>
    `;
}

const locationEl = document.getElementById("location");
const temperatureEl = document.getElementById("temperature");
const descriptionEl = document.getElementById("description");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");
const refreshBtn = document.getElementById("refresh");

// 固定北京坐标
const BEIJING_LAT = 39.9042;
const BEIJING_LON = 116.4074;

function weatherCodeToText(code) {
  const map = {
    0: "晴",
    1: "大部晴朗",
    2: "局部多云",
    3: "阴",
    45: "雾",
    48: "冻雾",
    51: "小毛毛雨",
    53: "中毛毛雨",
    55: "大毛毛雨",
    61: "小雨",
    63: "中雨",
    65: "大雨",
    71: "小雪",
    73: "中雪",
    75: "大雪",
    80: "阵雨",
    95: "雷暴"
  };
  return map[code] || `未知（${code}）`;
}

function formatHHMM(isoString) {
  if (!isoString || !isoString.includes("T")) return "--";
  return isoString.split("T")[1].slice(0, 5);
}

async function fetchBeijingWeather() {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${BEIJING_LAT}` +
    `&longitude=${BEIJING_LON}` +
    `&current=temperature_2m,weather_code` +
    `&daily=sunrise,sunset` +
    `&timezone=Asia%2FShanghai`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadWeather() {
  locationEl.textContent = "城市：北京";
  temperatureEl.textContent = "气温：--";
  descriptionEl.textContent = "天气：--";
  sunriseEl.textContent = "日出：--";
  sunsetEl.textContent = "日落：--";

  try {
    const data = await fetchBeijingWeather();
    const current = data.current;
    const sunrise = data.daily?.sunrise?.[0];
    const sunset = data.daily?.sunset?.[0];

    temperatureEl.textContent = `气温：${current.temperature_2m}°C`;
    descriptionEl.textContent = `天气：${weatherCodeToText(current.weather_code)}`;
    sunriseEl.textContent = `日出：${formatHHMM(sunrise)}`;
    sunsetEl.textContent = `日落：${formatHHMM(sunset)}`;
  } catch {
    descriptionEl.textContent = "天气：加载失败";
  }
}

refreshBtn.addEventListener("click", loadWeather);
loadWeather();