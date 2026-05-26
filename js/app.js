(function () {
  var BEIJING_LAT = 39.9042;
  var BEIJING_LON = 116.4074;
  var TIMEZONE = "Asia/Shanghai";
  var DEFAULT_REFRESH_HOURS = 1;
  var TIME_SEPARATOR = " / ";
  var refreshTimer = null;

  var dateEl = document.getElementById("date");
  var weatherIconEl = document.getElementById("weather-icon");
  var weatherTextEl = document.getElementById("weather-text");
  var currentTempEl = document.getElementById("current-temp");
  var windEl = document.getElementById("wind");
  var humidityEl = document.getElementById("humidity");
  var sunriseSunsetEl = document.getElementById("sunrise-sunset");
  var highLowEl = document.getElementById("high-low");
  var historyLastYearEl = document.getElementById("history-last-year");
  var historyTwoYearsEl = document.getElementById("history-two-years");
  var wikiQuoteEl = document.getElementById("wiki-quote");
  var wikiQuoteAuthorEl = document.getElementById("wiki-quote-author");
  var wikiQuoteContainerEl = wikiQuoteEl && wikiQuoteEl.parentNode ? wikiQuoteEl.parentNode : null;
  var updatedAtEl = document.getElementById("updated-at");

  var refreshHours = readRefreshHours();

  function readRefreshHours() {
    var body = document.body;
    var value = DEFAULT_REFRESH_HOURS;

    if (body && body.getAttribute) {
      var raw = body.getAttribute("data-refresh-hours");
      var parsed = parseFloat(raw);
      if (!isNaN(parsed) && parsed > 0) {
        value = parsed;
      }
    }

    return value;
  }

  function setText(element, value) {
    if (element) {
      element.textContent = value;
    }
  }

  function setUpdateStatus(value) {
    setText(updatedAtEl, value);
  }

  function pickDailyQuote(date) {
    var quotes = [
      { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
      { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
      { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
      { text: "Life is really simple, but we insist on making it complicated.", author: "Confucius" },
      { text: "学而不思则罔，思而不学则殆。", author: "孔子" },
      { text: "知之者不如好之者，好之者不如乐之者。", author: "孔子" },
      { text: "道阻且长，行则将至。", author: "《荀子》" },
      { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
      { text: "What we think, we become.", author: "Buddha" },
      { text: "行胜于言。", author: "老子" }
    ];
    var dayKey = date.getFullYear() * 1000 + dayOfYear(date);
    var index = dayKey % quotes.length;

    return quotes[index];
  }

  function dayOfYear(date) {
    var start = new Date(date.getFullYear(), 0, 1);
    var current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var diff = current.getTime() - start.getTime();

    return Math.floor(diff / 86400000) + 1;
  }

  function renderDailyQuote() {
    var quote = pickDailyQuote(new Date());
    var quoteLength = quote.text.replace(/\s+/g, "").length;
    var sizeClass = "quote-size-medium";

    if (quoteLength <= 18) {
      sizeClass = "quote-size-short";
    } else if (quoteLength >= 38) {
      sizeClass = "quote-size-long";
    }

    if (wikiQuoteContainerEl && wikiQuoteContainerEl.className) {
      wikiQuoteContainerEl.className = wikiQuoteContainerEl.className
        .replace(/\s?quote-size-short|\s?quote-size-medium|\s?quote-size-long/g, "")
        .trim();
      wikiQuoteContainerEl.className += " " + sizeClass;
    }

    setText(wikiQuoteEl, "“" + quote.text + "”");
    setText(wikiQuoteAuthorEl, "- " + quote.author);
  }

  function pad2(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function formatDate(date) {
    return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
  }

  function formatDisplayDate(date) {
    return date.getFullYear() + "年" + pad2(date.getMonth() + 1) + "月" + pad2(date.getDate()) + "日";
  }

  function formatDisplayDateTime(date) {
    return formatDisplayDate(date) + " " + pad2(date.getHours()) + ":" + pad2(date.getMinutes());
  }

  function formatTimeFromIso(value) {
    if (!value || typeof value !== "string") {
      return "--";
    }

    var parts = value.split("T");
    if (parts.length < 2 || !parts[1]) {
      return "--";
    }

    var timeText = parts[1];
    var match = timeText.match(/^(\d{1,2}):(\d{2})/);
    if (!match) {
      return "--";
    }

    return pad2(Number(match[1])) + ":" + match[2];
  }

  function formatTemperature(value) {
    var number = Number(value);
    if (value === null || value === undefined || value === "" || isNaN(number)) {
      return "--";
    }

    number = Math.round(number * 10) / 10;
    return (String(number).indexOf(".") === -1 ? String(number) : String(number)) + "°C";
  }

  function formatHumidity(value) {
    var number = Number(value);
    if (value === null || value === undefined || value === "" || isNaN(number)) {
      return "--";
    }

    return Math.round(number) + "%";
  }

  function formatWindSpeed(value) {
    var number = Number(value);
    if (value === null || value === undefined || value === "" || isNaN(number)) {
      return "--";
    }

    number = Math.round(number * 10) / 10;
    return (String(number).indexOf(".") === -1 ? String(number) : String(number)) + " km/h";
  }

  function degreesToDirection(value) {
    var degrees = Number(value);
    if (value === null || value === undefined || value === "" || isNaN(degrees)) {
      return "--";
    }

    degrees = ((degrees % 360) + 360) % 360;
    if (degrees < 22.5 || degrees >= 337.5) {
      return "北风";
    }
    if (degrees < 67.5) {
      return "东北风";
    }
    if (degrees < 112.5) {
      return "东风";
    }
    if (degrees < 157.5) {
      return "东南风";
    }
    if (degrees < 202.5) {
      return "南风";
    }
    if (degrees < 247.5) {
      return "西南风";
    }
    if (degrees < 292.5) {
      return "西风";
    }
    return "西北风";
  }

  function weatherInfo(code) {
    var value = Number(code);

    if (isNaN(value)) {
      return { icon: "--", text: "--" };
    }

    if (value === 0) {
      return { icon: "☀", text: "晴" };
    }
    if (value === 1 || value === 2) {
      return { icon: "⛅", text: "晴间多云" };
    }
    if (value === 3) {
      return { icon: "☁", text: "阴" };
    }
    if (value === 45 || value === 48) {
      return { icon: "〰", text: "雾" };
    }
    if (value === 51 || value === 53 || value === 55 || value === 56 || value === 57) {
      return { icon: "☂", text: "小雨" };
    }
    if (value === 61 || value === 63 || value === 65 || value === 66 || value === 67) {
      return { icon: "☔", text: "下雨" };
    }
    if (value === 71 || value === 73 || value === 75 || value === 77 || value === 85 || value === 86) {
      return { icon: "❄", text: "下雪" };
    }
    if (value === 80 || value === 81 || value === 82) {
      return { icon: "☔", text: "阵雨" };
    }
    if (value === 95 || value === 96 || value === 99) {
      return { icon: "⚡", text: "雷阵雨" };
    }

    return { icon: "？", text: "未知" };
  }

  function buildForecastUrl() {
    return "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + BEIJING_LAT +
      "&longitude=" + BEIJING_LON +
      "&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,wind_direction_10m" +
      "&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset" +
      "&timezone=" + TIMEZONE +
      "&forecast_days=1";
  }

  function buildHistoryUrl(yearOffset) {
    var today = new Date();
    var targetDate = new Date(today.getTime());
    targetDate.setFullYear(today.getFullYear() - yearOffset);

    var dateString = formatDate(targetDate);
    return "https://archive-api.open-meteo.com/v1/archive" +
      "?latitude=" + BEIJING_LAT +
      "&longitude=" + BEIJING_LON +
      "&start_date=" + dateString +
      "&end_date=" + dateString +
      "&daily=temperature_2m_max,temperature_2m_min,weather_code" +
      "&timezone=" + TIMEZONE;
  }

  function requestJson(url, callback) {
    var xhr = new XMLHttpRequest();

    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) {
        return;
      }

      if ((xhr.status >= 200 && xhr.status < 300) || (xhr.status === 0 && xhr.responseText)) {
        try {
          callback(null, JSON.parse(xhr.responseText));
        } catch (parseError) {
          callback(parseError);
        }
        return;
      }

      callback(new Error("HTTP " + xhr.status + " for " + url));
    };

    xhr.send(null);
  }

  function setLoadingState() {
    setText(dateEl, "--");
    setText(weatherIconEl, "--");
    setText(weatherTextEl, "--");
    setText(currentTempEl, "--");
    setText(windEl, "--");
    setText(humidityEl, "--");
    setText(sunriseSunsetEl, "--");
    setText(highLowEl, "--");
    setText(historyLastYearEl, "--");
    setText(historyTwoYearsEl, "--");
    setUpdateStatus("正在更新...");
  }

  function renderForecast(data) {
    var current = data && data.current ? data.current : {};
    var daily = data && data.daily ? data.daily : {};
    var info = weatherInfo(current.weather_code);
    var currentTime = current.time ? current.time.replace("T", " ") : formatDisplayDateTime(new Date());
    var minTemp = daily.temperature_2m_min && daily.temperature_2m_min.length ? daily.temperature_2m_min[0] : null;
    var maxTemp = daily.temperature_2m_max && daily.temperature_2m_max.length ? daily.temperature_2m_max[0] : null;
    var weatherText = info.text;
    var sunrise = daily.sunrise && daily.sunrise.length ? daily.sunrise[0] : null;
    var sunset = daily.sunset && daily.sunset.length ? daily.sunset[0] : null;
    var sunriseSunsetText = formatTimeFromIso(sunrise) + TIME_SEPARATOR + formatTimeFromIso(sunset);

    setText(dateEl, formatDisplayDate(new Date()));
    setText(weatherIconEl, info.icon);
    setText(weatherTextEl, weatherText);
    setText(currentTempEl, formatTemperature(current.temperature_2m));
    setText(windEl, formatWindSpeed(current.wind_speed_10m) + " " + degreesToDirection(current.wind_direction_10m));
    setText(humidityEl, formatHumidity(current.relative_humidity_2m));
    setText(sunriseSunsetEl, sunriseSunsetText);
    setText(highLowEl, formatTemperature(minTemp) + TIME_SEPARATOR + formatTemperature(maxTemp));
    setUpdateStatus("数据更新时间：" + currentTime);
  }

  function renderHistoryLine(element, yearOffset, data) {
    var daily = data && data.daily ? data.daily : {};
    var info = weatherInfo(daily.weather_code && daily.weather_code.length ? daily.weather_code[0] : null);
    var maxTemp = daily.temperature_2m_max && daily.temperature_2m_max.length ? daily.temperature_2m_max[0] : null;
    var minTemp = daily.temperature_2m_min && daily.temperature_2m_min.length ? daily.temperature_2m_min[0] : null;
    var text = info.text + "，" + formatTemperature(minTemp) + TIME_SEPARATOR + formatTemperature(maxTemp);

    setText(element, text);
  }

  function scheduleRefresh() {
    var delay = refreshHours * 60 * 60 * 1000;

    if (refreshTimer) {
      window.clearTimeout(refreshTimer);
    }

    refreshTimer = window.setTimeout(function () {
      window.location.reload();
    }, delay);
  }

  function loadWeather() {
    var remaining = 3;
    var hadError = false;

    function markDone(error) {
      if (error) {
        hadError = true;
      }

      remaining -= 1;
      if (remaining <= 0) {
        if (hadError && updatedAtEl && updatedAtEl.textContent === "正在更新...") {
          setUpdateStatus("数据更新时间：--（部分数据不可用）");
        }
      }
    }

    if (!window.XMLHttpRequest) {
      setUpdateStatus("当前浏览器不支持网络请求");
      return;
    }

    scheduleRefresh();
    setLoadingState();

    requestJson(buildForecastUrl(), function (error, data) {
      if (!error) {
        renderForecast(data);
      } else {
        hadError = true;
      }
      markDone(error);
    });

    requestJson(buildHistoryUrl(1), function (error, data) {
      if (!error) {
        renderHistoryLine(historyLastYearEl, 1, data);
      } else {
        hadError = true;
      }
      markDone(error);
    });

    requestJson(buildHistoryUrl(2), function (error, data) {
      if (!error) {
        renderHistoryLine(historyTwoYearsEl, 2, data);
      } else {
        hadError = true;
      }
      markDone(error);
    });
  }

  setText(dateEl, formatDisplayDate(new Date()));
  setUpdateStatus("正在更新...");
  renderDailyQuote();
  loadWeather();
})();
