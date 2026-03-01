const app = getApp();

Page({
  data: {
    wishText: '',
    difficulty: 'medium',
    dayIndex: 2,
    selectedPreset: -1,
    dayOptions: []
  },

  onLoad() {
    this.updateDayOptions('medium');
  },

  // 选择预设愿望
  selectPreset(e) {
    const { index, text, days, difficulty } = e.currentTarget.dataset;
    this.setData({
      selectedPreset: parseInt(index),
      wishText: text,
      difficulty: difficulty
    });
    this.updateDayOptions(difficulty);
    
    // 设置对应的天数索引
    const dayOptions = this.getDayOptions(difficulty);
    const dayIndex = dayOptions.findIndex(opt => opt.value === parseInt(days));
    this.setData({
      dayOptions: dayOptions,
      dayIndex: dayIndex >= 0 ? dayIndex : 0
    });
  },

  // 选择难度
  selectDifficulty(e) {
    const level = e.currentTarget.dataset.level;
    this.setData({ difficulty: level });
    this.updateDayOptions(level);
  },

  // 获取天数选项
  getDayOptions(difficulty) {
    const options = {
      easy: [
        { value: 1, text: '1天 (即时)' },
        { value: 2, text: '2天 (短期)' },
        { value: 3, text: '3天 (短期)' }
      ],
      medium: [
        { value: 7, text: '7天 (一周)' },
        { value: 10, text: '10天' },
        { value: 14, text: '14天 (两周)' }
      ],
      hard: [
        { value: 30, text: '30天 (一个月)' },
        { value: 60, text: '60天 (两个月)' },
        { value: 90, text: '90天 (三个月)' }
      ]
    };
    return options[difficulty] || options.medium;
  },

  // 更新天数选项
  updateDayOptions(difficulty) {
    const dayOptions = this.getDayOptions(difficulty);
    this.setData({
      dayOptions: dayOptions,
      dayIndex: 0
    });
  },

  // 输入愿望
  onWishInput(e) {
    this.setData({
      wishText: e.detail.value,
      selectedPreset: -1
    });
  },

  // 选择天数
  onDayChange(e) {
    this.setData({
      dayIndex: parseInt(e.detail.value)
    });
  },

  // 开始估值 - 简化逻辑，不再绑定特定任务类型
  startValuation() {
    const { wishText, dayOptions, dayIndex, difficulty } = this.data;
    
    if (!wishText.trim()) {
      wx.showToast({
        title: '请填写愿望',
        icon: 'none'
      });
      return;
    }

    const days = dayOptions[dayIndex].value;
    
    // 根据难度计算目标积分（不再绑定特定任务类型）
    const targetPoints = this.calculatePoints(difficulty, days);

    // 跳转到估值页面
    wx.navigateTo({
      url: `/pages/valuation/valuation?wish=${encodeURIComponent(wishText)}&target=${targetPoints}&days=${days}`
    });
  },

  // 计算目标积分
  calculatePoints(difficulty, days) {
    const ranges = {
      easy: { min: 50, max: 200 },
      medium: { min: 300, max: 800 },
      hard: { min: 1000, max: 5000 }
    };
    const range = ranges[difficulty] || ranges.medium;
    const basePoints = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    
    // 天数越长，积分越高
    const dayMultiplier = Math.min(days / 7, 2);
    return Math.floor(basePoints * (1 + dayMultiplier * 0.1));
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '我的愿望打卡本 - 记录每日小目标',
      query: 'from=timeline'
    };
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '我在记录每日小目标',
      path: '/pages/index/index'
    };
  }
});
