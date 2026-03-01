// utils/dateHelper.js
// 日期处理工具函数

/**
 * 获取本地日期字符串 (YYYY-MM-DD)
 */
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取本地时间戳对应的日期字符串
 */
function timestampToLocalDateString(timestamp) {
  const date = new Date(timestamp);
  return getLocalDateString(date);
}

/**
 * 比较两个日期（忽略时间）
 */
function compareDates(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return d1.getTime() - d2.getTime();
}

/**
 * 判断是否是今天
 */
function isToday(dateStr) {
  return dateStr === getLocalDateString();
}

/**
 * 判断是否是过去
 */
function isPast(dateStr) {
  return compareDates(dateStr, getLocalDateString()) < 0;
}

/**
 * 判断是否是未来
 */
function isFuture(dateStr) {
  return compareDates(dateStr, getLocalDateString()) > 0;
}

/**
 * 获取星期几名称
 */
function getWeekdayName(date) {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return weekdays[date.getDay()];
}

/**
 * 格式化日期显示
 */
function formatDateDisplay(dateStr) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = getWeekdayName(date);
  return `${month}月${day}日 周${weekday}`;
}

module.exports = {
  getLocalDateString,
  timestampToLocalDateString,
  compareDates,
  isToday,
  isPast,
  isFuture,
  getWeekdayName,
  formatDateDisplay
};