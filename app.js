App({
  globalData: {
    userInfo: null,
    totalPoints: 0,
    completedTasks: 0,
    completedWishes: 0,
    streak: {
      current: 0,
      lastCheckIn: null,
      bufferUsed: false
    },
    // 海报分享配置
    posterConfig: {
      // 二维码图片路径（本地图片，打包在小程序内）
      qrCodeUrl: '/images/qr/qrcode.png'
    }
  },

  onLaunch() {
    // 加载本地存储数据
    this.loadGlobalData();
    
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
    
    // 检查每日重置
    this.checkDailyReset();
  },

  onShow() {
    this.loadGlobalData();
  },

  // 加载全局数据
  loadGlobalData() {
    try {
      const totalPoints = wx.getStorageSync('echoluck_total_points') || 0;
      const completedTasks = wx.getStorageSync('echoluck_completed_tasks') || 0;
      const completedWishes = wx.getStorageSync('echoluck_completed_wishes') || 0;
      const streak = wx.getStorageSync('echoluck_streak') || { current: 0, lastCheckIn: null, bufferUsed: false };
      
      this.globalData.totalPoints = parseInt(totalPoints);
      this.globalData.completedTasks = parseInt(completedTasks);
      this.globalData.completedWishes = parseInt(completedWishes);
      this.globalData.streak = typeof streak === 'string' ? JSON.parse(streak) : streak;
    } catch (e) {
      console.error('加载数据失败:', e);
    }
  },

  // 保存全局数据
  saveGlobalData() {
    try {
      wx.setStorageSync('echoluck_total_points', this.globalData.totalPoints);
      wx.setStorageSync('echoluck_completed_tasks', this.globalData.completedTasks);
      wx.setStorageSync('echoluck_completed_wishes', this.globalData.completedWishes);
      wx.setStorageSync('echoluck_streak', JSON.stringify(this.globalData.streak));
    } catch (e) {
      console.error('保存数据失败:', e);
    }
  },

  // 播放打卡成功动画
  playCheckInAnimation(score) {
    // 震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    
    // 显示动画提示
    wx.showToast({
      title: `+${score} 积分`,
      icon: 'success',
      duration: 1500
    });
  },

  // 播放愿望完成动画
  playWishCompleteAnimation(wishName, totalScore) {
    // 震动反馈
    if (wx.vibrateLong) {
      wx.vibrateLong();
    }
    
    // 显示模态框动画
    wx.showModal({
      title: '🎉 愿望达成！',
      content: `恭喜你完成了「${wishName}」！\n\n获得 ${totalScore} 积分`,
      showCancel: false,
      confirmText: '太棒了！',
      confirmColor: '#FF6B9D',
      success: () => {
        // 可以在这里添加额外的动画效果
      }
    });
    
    // 播放音效（如果支持）
    const innerAudioContext = wx.createInnerAudioContext();
    innerAudioContext.src = '/sounds/success.mp3';
    innerAudioContext.play();
  },

  // 检查每日重置
  checkDailyReset() {
    const now = new Date();
    const today = now.toDateString();
    const lastRefresh = wx.getStorageSync('echoluck_last_refresh');

    if (lastRefresh !== today) {
      // 重置每日刷新次数
      wx.setStorageSync('echoluck_refresh_count', 3);
      wx.setStorageSync('echoluck_last_refresh', today);
      
      // 清空今日任务
      wx.removeStorageSync('echoluck_daily_tasks');
    }

    // 检查 Streak 状态
    this.checkStreakStatus();
  },

  // 检查连续打卡状态
  checkStreakStatus() {
    const streak = this.globalData.streak;
    if (!streak.lastCheckIn) return;

    const now = new Date();
    const lastDate = new Date(streak.lastCheckIn);
    const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays >= 2) {
      if (diffDays === 2 && !streak.bufferUsed) {
        // 进入缓冲期
        streak.bufferUsed = true;
        this.saveGlobalData();
        wx.showToast({
          title: '进入缓冲期，明天打卡可保留加成',
          icon: 'none'
        });
      } else if (diffDays > 2 || (diffDays === 2 && streak.bufferUsed)) {
        // 断签
        if (streak.current > 0) {
          wx.showToast({
            title: '连续打卡已中断',
            icon: 'none'
          });
        }
        streak.current = 0;
        streak.bufferUsed = false;
        this.saveGlobalData();
      }
    }
  },

  // 获取连续打卡加成
  getStreakBonus() {
    const days = this.globalData.streak.current;
    if (days >= 30) return 50;
    if (days >= 14) return 30;
    if (days >= 7) return 20;
    if (days >= 3) return 10;
    return 0;
  },

  // 打卡
  doCheckIn() {
    const now = new Date();
    const today = now.toDateString();
    const streak = this.globalData.streak;

    if (streak.lastCheckIn === today) {
      return false; // 今天已打卡
    }

    const lastDate = streak.lastCheckIn ? new Date(streak.lastCheckIn) : null;
    const diffDays = lastDate ? Math.floor((now - lastDate) / (1000 * 60 * 60 * 24)) : 999;

    if (diffDays === 1 || (diffDays === 2 && streak.bufferUsed)) {
      // 连续打卡
      streak.current++;
      streak.bufferUsed = false;
      
      // 里程碑奖励
      if ([3, 7, 14, 30].includes(streak.current)) {
        wx.showToast({
          title: `${streak.current}天里程碑！加成提升！`,
          icon: 'none'
        });
      }
    } else {
      // 新开始
      streak.current = 1;
      streak.bufferUsed = false;
    }

    streak.lastCheckIn = today;
    this.saveGlobalData();
    return true;
  }
});
