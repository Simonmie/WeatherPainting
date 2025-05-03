import generate7daysWeatherSVG from "./libs/7days.js";

// 立即执行生成SVG
generate7daysWeatherSVG().catch((error) => {
  console.error("执行失败:", error);
});
