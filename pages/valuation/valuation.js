Page({
  data: {
    wish: '',
    targetPoints: 0,
    displayPrice: 0,
    days: 7,
    locked: false,
    statusText: '等待评估锁定...',
    voteBubbles: []
  },

  valuationInterval: null,
  bubbleTimeout: null,

  onLoad(options) {
    const { wish, target, days } = options;
    
    this.setData({
      wish: decodeURIComponent(wish || ''),
      targetPoints: parseInt(target) || 100,
      days: parseInt(days) || 7,
      displayPrice: 0
    });

    // 开始估值动画
    this.startValuationAnimation();
  },

  onUnload() {
    // 清理定时器
    if (this.valuationInterval) {
      clearInterval(this.valuationInterval);
    }
    if (this.bubbleTimeout) {
      clearTimeout(this.bubbleTimeout);
    }
  },

  // 开始估值动画
  startValuationAnimation() {
    const target = this.data.targetPoints;
    let currentDisplay = 0;

    // 估值数字动画
    this.valuationInterval = setInterval(() => {
      const vote = Math.floor(target * (0.8 + Math.random() * 0.5));
      currentDisplay = Math.floor((currentDisplay + vote) / 2);
      if (currentDisplay === 0) currentDisplay = vote;
      
      this.setData({ displayPrice: currentDisplay });
      this.addVoteBubble(vote);
    }, 600);

    // 3秒后锁定
    setTimeout(() => {
      clearInterval(this.valuationInterval);
      this.setData({
        locked: true,
        statusText: '评估完成，目标已锁定'
      });
    }, 3000);
  },

  // 添加投票气泡
  addVoteBubble(vote) {
    const id = Date.now();
    const bubble = {
      id: id,
      text: `用户${Math.floor(Math.random() * 900)}: 估值 ${vote}`,
      left: Math.random() * 60,
      top: Math.random() * 60
    };

    const voteBubbles = [...this.data.voteBubbles, bubble];
    this.setData({ voteBubbles });

    // 2秒后移除
    this.bubbleTimeout = setTimeout(() => {
      const filtered = this.data.voteBubbles.filter(b => b.id !== id);
      this.setData({ voteBubbles: filtered });
    }, 2000);
  },

  // 接受挑战
  acceptChallenge() {
    if (!this.data.locked) return;

    const app = getApp();
    
    // 创建新胶囊 - 不绑定特定任务类型
    const capsule = {
      id: Date.now().toString(),
      wish: this.data.wish,
      points: this.data.targetPoints,
      days: this.data.days,
      currentPoints: 0,
      dailyLogs: [], // 每日记录
      createdAt: new Date().toLocaleDateString('zh-CN'),
      deadline: this.calculateDeadline(this.data.days),
      completed: false,
      completedAt: null,
      remainingDays: this.data.days,
      progress: 0,
      isExpired: false
    };

    // 保存到胶囊列表
    let capsules = wx.getStorageSync('echoluck_capsules') || [];
    capsules.unshift(capsule);
    wx.setStorageSync('echoluck_capsules', capsules);

    // 显示成功提示
    wx.showToast({
      title: '目标记录创建成功！',
      icon: 'success',
      duration: 2000
    });

    // 跳转到仪表盘
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/dashboard/dashboard'
      });
    }, 1500);
  },

  // 计算截止日期
  calculateDeadline(days) {
    const date = new Date();
    date.setDate(date.getDate() + parseInt(days));
    return date.toISOString();
  }
});
