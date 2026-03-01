// pages/statistics/statistics.js
Page({
  data: {
    // 总体数据
    totalGoals: 25,
    completedGoals: 18,
    completionRate: 72,
    totalPoints: 3580,
    
    // 连续打卡
    currentStreak: 7,
    maxStreak: 15,
    
    // 周期统计
    period: 'week',
    periodStats: {
      checkInDays: 5,
      totalDays: 7,
      checkInRate: 71,
      completedGoals: 3,
      goalRate: 60,
      points: 450
    },
    
    // 成就徽章
    badges: [
      { id: 1, name: '初次打卡', icon: '🌱', unlocked: true },
      { id: 2, name: '连续7天', icon: '🔥', unlocked: true },
      { id: 3, name: '连续30天', icon: '💎', unlocked: false },
      { id: 4, name: '完成10个目标', icon: '🏆', unlocked: true },
      { id: 5, name: '积分达人', icon: '⭐', unlocked: false },
      { id: 6, name: '早起鸟', icon: '🌅', unlocked: true }
    ]
  },

  onLoad() {
    this.loadStatistics();
  },

  // 加载统计数据
  loadStatistics() {
    // 从本地存储获取真实数据
    const capsules = wx.getStorageSync('echoluck_capsules') || [];
    const checkInRecords = wx.getStorageSync('checkin_records') || {};
    
    // 计算总体数据
    const totalGoals = capsules.length;
    const completedGoals = capsules.filter(c => c.completed).length;
    const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
    const totalPoints = capsules.reduce((sum, c) => sum + (c.currentPoints || 0), 0);
    
    // 计算连续打卡天数
    const { currentStreak, maxStreak } = this.calculateStreak(checkInRecords);
    
    this.setData({
      totalGoals,
      completedGoals,
      completionRate,
      totalPoints,
      currentStreak,
      maxStreak
    });
    
    // 加载周期统计
    this.loadPeriodStats('week');
  },

  // 计算连续打卡
  calculateStreak(records) {
    const dates = Object.keys(records).sort();
    if (dates.length === 0) return { currentStreak: 0, maxStreak: 0 };
    
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    let lastDate = null;
    
    const today = new Date().toISOString().split('T')[0];
    
    dates.forEach(date => {
      if (lastDate) {
        const last = new Date(lastDate);
        const current = new Date(date);
        const diffDays = (current - last) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      lastDate = date;
    });
    
    maxStreak = Math.max(maxStreak, tempStreak);
    
    // 检查今天是否打卡
    const lastCheckIn = dates[dates.length - 1];
    const lastDate2 = new Date(lastCheckIn);
    const todayDate = new Date(today);
    const diffToToday = (todayDate - lastDate2) / (1000 * 60 * 60 * 24);
    
    if (diffToToday <= 1) {
      currentStreak = tempStreak;
    } else {
      currentStreak = 0;
    }
    
    return { currentStreak, maxStreak };
  },

  // 切换周期
  switchPeriod(e) {
    const period = e.currentTarget.dataset.period;
    this.setData({ period });
    this.loadPeriodStats(period);
  },

  // 加载周期统计
  loadPeriodStats(period) {
    // 模拟数据，实际应根据period计算
    const stats = period === 'week' ? {
      checkInDays: 5,
      totalDays: 7,
      checkInRate: 71,
      completedGoals: 3,
      goalRate: 60,
      points: 450
    } : {
      checkInDays: 20,
      totalDays: 28,
      checkInRate: 71,
      completedGoals: 8,
      goalRate: 53,
      points: 1250
    };
    
    this.setData({ periodStats: stats });
  },

  // 生成海报
  generatePoster() {
    const PosterGenerator = require('../../utils/posterGenerator.js');
    const generator = new PosterGenerator();
    
    wx.showLoading({ title: '生成中...' });
    
    // 准备海报数据
    const posterData = {
      userName: '我',
      checkInDays: this.data.totalGoals,
      totalPoints: this.data.totalPoints,
      completedGoals: this.data.completedGoals,
      streakDays: this.data.currentStreak,
      quote: '坚持就是胜利'
    };
    
    // 生成海报
    generator.generateCheckInPoster(posterData, (err, tempFilePath) => {
      wx.hideLoading();
      
      if (err) {
        wx.showToast({
          title: '生成失败',
          icon: 'error'
        });
        console.error('海报生成失败:', err);
        return;
      }
      
      // 保存到相册
      wx.saveImageToPhotosAlbum({
        filePath: tempFilePath,
        success: () => {
          wx.showModal({
            title: '保存成功',
            content: '海报已保存到相册，快去分享吧！',
            showCancel: false
          });
        },
        fail: (saveErr) => {
          if (saveErr.errMsg.includes('auth')) {
            // 需要授权
            wx.showModal({
              title: '需要授权',
              content: '请授权保存图片到相册',
              success: (res) => {
                if (res.confirm) {
                  wx.openSetting();
                }
              }
            });
          } else {
            wx.showToast({
              title: '保存失败',
              icon: 'error'
            });
          }
        }
      });
    });
  }
});