// pages/calendar/calendar.js
const { getLocalDateString, timestampToLocalDateString, isToday, isPast, isFuture, formatDateDisplay } = require('../../utils/dateHelper.js');

Page({
  data: {
    currentYear: 2026,
    currentMonth: 3,
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    days: [],
    selectedDate: null,
    selectedDateStr: '',
    dayLogs: [],
    dayTotalScore: 0,
    // 概览数据
    overview: {
      totalWishes: 0,
      completedWishes: 0,
      totalLogs: 0,
      totalScore: 0,
      currentStreak: 0,
      longestStreak: 0,
      monthlyStats: []
    },
    stats: {
      totalLogs: 0,
      currentStreak: 0,
      totalScore: 0
    }
  },

  onLoad() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1
    });
    this.loadCalendarData();
    this.loadOverview();
  },

  onShow() {
    this.loadCalendarData();
    this.loadStats();
    this.loadOverview();
  },

  // 加载概览数据
  loadOverview() {
    const capsules = wx.getStorageSync('echoluck_capsules') || [];
    
    let totalWishes = capsules.length;
    let completedWishes = 0;
    let totalLogs = 0;
    let totalScore = 0;
    
    const allDates = [];
    
    capsules.forEach(capsule => {
      if (capsule.completed) {
        completedWishes++;
      }
      
      if (capsule.dailyLogs) {
        capsule.dailyLogs.forEach(log => {
          totalLogs++;
          totalScore += log.score || 0;
          
          const dateStr = timestampToLocalDateString(log.timestamp);
          allDates.push(dateStr);
        });
      }
    });
    
    // 计算连续打卡
    const uniqueDates = [...new Set(allDates)].sort();
    const { currentStreak, longestStreak } = this.calculateStreakStats(uniqueDates);
    
    // 计算最近6个月的统计
    const monthlyStats = this.calculateMonthlyStats(capsules);
    
    this.setData({
      overview: {
        totalWishes,
        completedWishes,
        totalLogs,
        totalScore,
        currentStreak,
        longestStreak,
        monthlyStats
      }
    });
  },

  // 计算连续打卡统计
  calculateStreakStats(sortedDates) {
    if (sortedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }
    
    const today = getLocalDateString();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    
    // 检查今天或昨天是否有记录
    const lastDate = sortedDates[sortedDates.length - 1];
    const lastDateObj = new Date(lastDate);
    const todayObj = new Date(today);
    const diffDays = (todayObj - lastDateObj) / (1000 * 60 * 60 * 24);
    
    if (diffDays <= 1) {
      // 今天或昨天有记录，计算当前连续
      currentStreak = 1;
      for (let i = sortedDates.length - 2; i >= 0; i--) {
        const curr = new Date(sortedDates[i + 1]);
        const prev = new Date(sortedDates[i]);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    
    // 计算最长连续
    longestStreak = 1;
    tempStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const curr = new Date(sortedDates[i]);
      const prev = new Date(sortedDates[i - 1]);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      
      if (diff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    
    return { currentStreak, longestStreak };
  },

  // 计算月度统计
  calculateMonthlyStats(capsules) {
    const stats = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      
      let logs = 0;
      let score = 0;
      
      capsules.forEach(capsule => {
        if (capsule.dailyLogs) {
          capsule.dailyLogs.forEach(log => {
            const logDate = new Date(log.timestamp);
            if (logDate.getFullYear() === year && logDate.getMonth() + 1 === month) {
              logs++;
              score += log.score || 0;
            }
          });
        }
      });
      
      stats.push({
        year,
        month,
        label: `${month}月`,
        logs,
        score
      });
    }
    
    return stats;
  },

  // 加载日历数据
  loadCalendarData() {
    const { currentYear, currentMonth } = this.data;
    const capsules = wx.getStorageSync('echoluck_capsules') || [];
    
    // 获取该月的所有记录
    const monthLogs = [];
    capsules.forEach(capsule => {
      if (capsule.dailyLogs) {
        capsule.dailyLogs.forEach(log => {
          const logDate = new Date(log.timestamp);
          if (logDate.getFullYear() === currentYear && 
              logDate.getMonth() + 1 === currentMonth) {
            monthLogs.push({
              ...log,
              date: timestampToLocalDateString(log.timestamp),
              day: logDate.getDate()
            });
          }
        });
      }
    });

    // 生成日历天数
    const days = this.generateDays(currentYear, currentMonth, monthLogs);
    
    this.setData({ days });
  },

  // 生成日历天数
  generateDays(year, month, monthLogs) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();
    
    const days = [];
    const todayStr = getLocalDateString();
    
    // 上个月的日期
    const prevMonthDays = new Date(year, month - 1, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const dateObj = new Date(year, month - 2, day);
      const date = getLocalDateString(dateObj);
      days.push({
        day,
        date,
        type: 'prev-month',
        isPast: true,
        hasLog: false
      });
    }
    
    // 当月日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month - 1, day);
      const date = getLocalDateString(dateObj);
      const dayLogs = monthLogs.filter(log => log.day === day);
      const isTodayDate = date === todayStr;
      const isPastDate = !isTodayDate && isPast(date);
      const isFutureDate = !isTodayDate && isFuture(date);
      
      days.push({
        day,
        date,
        type: 'current-month',
        isToday: isTodayDate,
        isPast: isPastDate,
        isFuture: isFutureDate,
        hasLog: dayLogs.length > 0,
        logs: dayLogs,
        streak: this.calculateStreak(date, monthLogs)
      });
    }
    
    // 下个月的日期
    const remainingDays = 42 - days.length; // 6行 x 7列
    for (let day = 1; day <= remainingDays; day++) {
      const dateObj = new Date(year, month, day);
      const date = getLocalDateString(dateObj);
      days.push({
        day,
        date,
        type: 'next-month',
        isFuture: true,
        hasLog: false
      });
    }
    
    return days;
  },

  // 计算连续打卡天数
  calculateStreak(dateStr, monthLogs) {
    const date = new Date(dateStr);
    let streak = 0;
    
    // 检查当天是否有记录
    const hasTodayLog = monthLogs.some(log => {
      const logDate = new Date(log.timestamp);
      return logDate.toISOString().split('T')[0] === dateStr;
    });
    
    if (!hasTodayLog) return 0;
    
    streak = 1;
    
    // 向前检查连续天数
    const capsules = wx.getStorageSync('echoluck_capsules') || [];
    const allLogs = [];
    capsules.forEach(capsule => {
      if (capsule.dailyLogs) {
        allLogs.push(...capsule.dailyLogs);
      }
    });
    
    const sortedDates = [...new Set(allLogs.map(log => 
      new Date(log.timestamp).toISOString().split('T')[0]
    ))].sort();
    
    const dateIndex = sortedDates.indexOf(dateStr);
    if (dateIndex === -1) return 1;
    
    // 向后检查（更早的日期）
    for (let i = dateIndex - 1; i >= 0; i--) {
      const current = new Date(sortedDates[i + 1]);
      const prev = new Date(sortedDates[i]);
      const diff = (current - prev) / (1000 * 60 * 60 * 24);
      
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  },

  // 切换月份
  changeMonth(e) {
    const delta = parseInt(e.currentTarget.dataset.delta);
    let { currentYear, currentMonth } = this.data;
    
    currentMonth += delta;
    
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    } else if (currentMonth < 1) {
      currentMonth = 12;
      currentYear--;
    }
    
    this.setData({ currentYear, currentMonth }, () => {
      this.loadCalendarData();
    });
  },

  // 选择日期
  selectDate(e) {
    const date = e.currentTarget.dataset.date;
    const capsules = wx.getStorageSync('echoluck_capsules') || [];
    
    // 获取该日期的所有记录
    const dayLogs = [];
    capsules.forEach(capsule => {
      if (capsule.dailyLogs) {
        capsule.dailyLogs.forEach(log => {
          const logDateStr = timestampToLocalDateString(log.timestamp);
          if (logDateStr === date) {
            dayLogs.push({
              ...log,
              capsuleWish: capsule.wish
            });
          }
        });
      }
    });
    
    // 计算当日总分
    const dayTotalScore = dayLogs.reduce((sum, log) => sum + (log.score || 0), 0);
    
    // 格式化日期字符串
    const dateStr = formatDateDisplay(date);
    
    this.setData({
      selectedDate: date,
      selectedDateStr: dateStr,
      dayLogs: dayLogs.sort((a, b) => b.timestamp - a.timestamp),
      dayTotalScore
    });
  },

  // 加载统计数据
  loadStats() {
    const capsules = wx.getStorageSync('echoluck_capsules') || [];
    const { currentYear, currentMonth } = this.data;
    
    let totalLogs = 0;
    let totalScore = 0;
    
    // 计算本月数据
    capsules.forEach(capsule => {
      if (capsule.dailyLogs) {
        capsule.dailyLogs.forEach(log => {
          totalScore += log.score || 0;
          
          const logDate = new Date(log.timestamp);
          if (logDate.getFullYear() === currentYear && 
              logDate.getMonth() + 1 === currentMonth) {
            totalLogs++;
          }
        });
      }
    });
    
    // 从全局数据获取连续打卡
    const app = getApp();
    const currentStreak = app.globalData?.streak?.current || 0;
    
    this.setData({
      stats: {
        totalLogs,
        currentStreak,
        totalScore
      }
    });
  }
});
