import fetch from "node-fetch";

import { weatherIconMap } from "../contents/weatherIconMap.js";

// 获取天气描述
function getWeatherDescription(code) {
  const descriptions = {
    0: "晴天",
    1: "晴天",
    2: "多云",
    3: "阴天",
    45: "有雾",
    48: "霜冻",
    51: "小雨",
    53: "小雨",
    55: "小雨",
    56: "雨夹雪",
    57: "雨夹雪",
    61: "小雨",
    63: "中雨",
    65: "大雨",
    66: "雨夹雪",
    67: "雨夹雪",
    71: "小雪",
    73: "中雪",
    75: "大雪",
    77: "雪",
    80: "小阵雨",
    81: "中阵雨",
    82: "强阵雨",
    85: "小雪",
    86: "大雪",
    95: "雷雨",
    96: "雷雨",
    99: "冰雹",
  };
  return descriptions[code] || "未知天气";
}

// 获取天气数据并生成SVG
async function generate7daysWeatherSVG() {
  try {
    // TODO: 填写目标城市的经纬度
    // 这里以福州连江为例
    const latitude = 26.3174; // 福州连江的纬度
    const longitude = 119.5384; // 福州连江的经度
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FShanghai&forecast_days=7`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("无法获取天气数据");
    }

    const data = await response.json();
    const dailyData = [];

    // 处理天气数据
    for (let i = 0; i < data.daily.time.length; i++) {
      const date = new Date(data.daily.time[i]);
      const weatherCode = data.daily.weathercode[i];
      const maxTemp = Math.round(data.daily.temperature_2m_max[i]);
      const minTemp = Math.round(data.daily.temperature_2m_min[i]);
      dailyData.push({
        date: date,
        maxTemp: maxTemp,
        minTemp: minTemp,
        weatherCode: weatherCode,
        description: getWeatherDescription(weatherCode),
      });
    }

    // 生成SVG
    // TODO: 你可以手动修改生成SVG的title信息，这里默认为"连江县七天天气预报"
    const svgWidth = dailyData.length * 100;
    const svgHeight = 180;
    let fullSvgContent = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${svgWidth}" height="${svgHeight}" fill="transparent"/>
    <text x="${
      svgWidth / 2
    }" y="20" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle" fill="white" stroke="black" stroke-width="0.5">连江县七天天气预报</text>
`;

    // 并行加载所有图标
    const iconPromises = dailyData.map(async (day, i) => {
      const xPos = i * 100;
      const iconName = weatherIconMap[day.weatherCode] || "天气-多云.svg";
      const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      const weekday = weekdays[day.date.getDay()];
      const month = day.date.getMonth() + 1;
      const date = day.date.getDate();

      try {
        const response = await fetch(
          `http://localhost:3000/static/${iconName}`
        );
        const iconSvg = await response.text();
        const base64Icon = btoa(iconSvg);

        return `
    <g transform="translate(${xPos}, 30)">
      <rect width="100" height="160" fill="transparent"/>
      <text x="50" y="20" font-family="Arial" font-size="14" text-anchor="middle" fill="white" stroke="black" stroke-width="0.5">${weekday} ${month}/${date}</text>
      <image href="data:image/svg+xml;base64,${base64Icon}" x="25" y="30" width="50" height="50"/>
      <text x="50" y="100" font-family="Arial" font-size="14" font-weight="bold" text-anchor="middle" fill="white" stroke="black" stroke-width="0.5">${day.maxTemp}°C / ${day.minTemp}°C</text>
      <text x="50" y="125" font-family="Arial" font-size="12" text-anchor="middle" fill="white" stroke="black" stroke-width="0.5">${day.description}</text>
    </g>`;
      } catch (error) {
        console.error(`Error loading icon ${iconName}:`, error);
        return `
    <g transform="translate(${xPos}, 30)">
      <rect width="100" height="160" fill="transparent"/>
      <text x="50" y="20" font-family="Arial" font-size="14" text-anchor="middle" fill="white" stroke="black" stroke-width="0.5">${weekday} ${month}/${date}</text>
      <text x="50" y="65" font-family="Arial" font-size="10" text-anchor="middle" fill="red" stroke="black" stroke-width="0.5">图标加载失败</text>
      <text x="50" y="100" font-family="Arial" font-size="14" font-weight="bold" text-anchor="middle" fill="white" stroke="black" stroke-width="0.5">${day.maxTemp}°C / ${day.minTemp}°C</text>
      <text x="50" y="125" font-family="Arial" font-size="12" text-anchor="middle" fill="white" stroke="black" stroke-width="0.5">${day.description}</text>
    </g>`;
      }
    });

    const iconResults = await Promise.all(iconPromises);
    fullSvgContent += iconResults.join("") + "\n</svg>";

    // 保存SVG文件
    const saveResponse = await fetch("http://localhost:3000/save-svg", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ svg: fullSvgContent }),
    });

    const result = await saveResponse.json();
    if (!result.success) {
      throw new Error(result.error || "保存失败");
    }

    console.log("天气预报SVG已保存到项目根目录");
  } catch (error) {
    console.error("生成SVG失败:", error);
    throw error;
  }
}

export default generate7daysWeatherSVG;
