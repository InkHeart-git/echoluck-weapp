// pages/dashboard/dashboard.js
const app = getApp();
const PosterGenerator = require('../../utils/posterGenerator.js');

Page({
  data: {
    capsules: [],
    totalPoints: 0,
    completedWishes: 0,
    streak: {
      current: 0,
      lastCheckIn: null
    },
    todayCheckedIn: false,
    loading: true
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  // 加载数据
  loadData() {
    const globalData = app.globalData;
    let capsules = wx.getStorageSync('echoluck_capsules') || [];
    
    // 处理胶囊数据（计算进度、过期等）
    capsules = this.processCapsules(capsules);
    
    // 检查今日是否已打卡
    const today = new Date().toDateString();
    const todayCheckedIn = globalData.streak.lastCheckIn === today;

    this.setData({
      capsules: capsules,
      totalPoints: globalData.totalPoints,
      completedWishes: globalData.completedWishes,
      streak: globalData.streak,
      todayCheckedIn: todayCheckedIn,
      streakBonus: app.getStreakBonus(),
      loading: false
    });
  },

  // 处理胶囊数据
  processCapsules(capsules) {
    const now = new Date();
    
    return capsules.map(capsule => {
      if (capsule.completed) return capsule;
      
      const created = new Date(capsule.createdAt);
      const deadline = new Date(capsule.deadline);
      const totalDays = capsule.days * 24 * 60 * 60 * 1000;
      const elapsed = now - created;
      const remaining = deadline - now;
      
      // 计算进度百分比
      const progress = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
      
      // 计算剩余天数
      const remainingDays = Math.ceil(remaining / (24 * 60 * 60 * 1000));
      
      // 检查是否过期
      const isExpired = remaining <= 0;
      
      return {
        ...capsule,
        progress: Math.round(progress),
        remainingDays: Math.max(0, remainingDays),
        isExpired: isExpired
      };
    });
  },

  // 打卡
  onCheckIn() {
    if (this.data.todayCheckedIn) {
      wx.showToast({
        title: '今日已打卡',
        icon: 'none'
      });
      return;
    }

    const success = app.doCheckIn();
    if (success) {
      // 打卡奖励积分
      const bonus = app.getStreakBonus();
      const reward = 10 + bonus;
      app.globalData.totalPoints += reward;
      app.saveGlobalData();

      wx.showToast({
        title: `打卡成功！+${reward}pt`,
        icon: 'success'
      });

      this.loadData();
    }
  },

  // 记录今日善行
  onLogToday(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/daily-log/daily-log?id=${id}`
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 什么都不做，只是阻止冒泡
  },

  // 完成任务（带验证）
  onCompleteTask(e) {
    const { id } = e.currentTarget.dataset;
    const capsules = this.data.capsules;
    const capsule = capsules.find(c => c.id === id);

    if (!capsule || capsule.completed) return;

    // 显示任务验证对话框
    wx.showModal({
      title: '完成任务验证',
      content: `请简要描述你如何完成了「${capsule.taskExample || capsule.taskTypeName}」这项任务：`,
      editable: true,
      placeholderText: '例如：今天我帮邻居搬了家具，他们很开心',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          // 用户提交了验证内容
          const verification = {
            date: new Date().toLocaleString('zh-CN'),
            description: res.content.trim(),
            verified: true
          };

          // 标记完成并记录验证
          capsule.completed = true;
          capsule.completedAt = new Date().toISOString();
          capsule.verificationLog = capsule.verificationLog || [];
          capsule.verificationLog.push(verification);

          // 增加积分
          app.globalData.totalPoints += capsule.points;
          app.globalData.completedWishes++;
          app.globalData.completedTasks++;
          app.saveGlobalData();

          // 保存胶囊数据
          wx.setStorageSync('echoluck_capsules', capsules);

          wx.showToast({
            title: `完成！+${capsule.points}pt`,
            icon: 'success'
          });

          this.loadData();
        } else if (res.confirm) {
          // 用户点了确认但没有输入内容
          wx.showToast({
            title: '请描述任务完成情况',
            icon: 'none'
          });
        }
      }
    });
  },

  // 点击胶囊
  onCapsuleTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/daily-log/daily-log?capsuleId=${id}`
    });
  },

  // 创建新愿望
  onCreateNew() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // 删除胶囊
  onDeleteCapsule(e) {
    const { id } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确认吗？',
      success: (res) => {
        if (res.confirm) {
          let capsules = this.data.capsules;
          capsules = capsules.filter(c => c.id !== id);
          wx.setStorageSync('echoluck_capsules', capsules);
          this.loadData();
          
          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { totalPoints, completedWishes } = this.data;
    return {
      title: `我在我的愿望打卡本完成了 ${completedWishes} 个目标`,
      query: 'from=timeline'
    };
  },

  // 分享给朋友
  onShareAppMessage() {
    const { totalPoints } = this.data;
    return {
      title: `我在我的愿望打卡本积累了 ${totalPoints} 积分`,
      path: '/pages/index/index'
    };
  },

  // 生成分享海报
  async onGeneratePoster() {
    const posterGen = new PosterGenerator();
    
    wx.showLoading({ 
      title: '生成海报中...',
      mask: true 
    });

    try {
      // 获取随机激励语
      const quotes = [
        '坚持就是胜利',
        '每一天都是新的开始',
        '积少成多，聚沙成塔',
        '越努力，越幸运',
        '星光不问赶路人',
        '时光不负有心人'
      ];
      const quote = quotes[Math.floor(Math.random() * quotes.length)];

      // 准备海报数据
      const posterData = {
        userName: app.globalData.userInfo?.nickName || '我',
        streakDays: this.data.streak.current,
        checkInDays: app.globalData.completedTasks || 0,
        completedGoals: this.data.completedWishes,
        totalPoints: this.data.totalPoints,
        quote: quote,
        // 如果有配置二维码URL，传入
        qrCodeUrl: app.globalData.posterConfig?.qrCodeUrl || null
      };

      posterGen.generateCheckInPoster(posterData, (err, tempFilePath) => {
        wx.hideLoading();
        
        if (err) {
          console.error('海报生成失败:', err);
          wx.showToast({ 
            title: '生成失败，请重试', 
            icon: 'none' 
          });
          return;
        }

        // 显示预览和操作选项
        wx.showActionSheet({
          itemList: ['保存到相册', '预览图片'],
          success: (res) => {
            if (res.tapIndex === 0) {
              // 保存到相册
              wx.saveImageToPhotosAlbum({
                filePath: tempFilePath,
                success: () => {
                  wx.showToast({ 
                    title: '已保存到相册',
                    icon: 'success' 
                  });
                },
                fail: (saveErr) => {
                  if (saveErr.errMsg.includes('auth')) {
                    // 需要授权
                    wx.showModal({
                      title: '需要授权',
                      content: '保存图片需要访问相册权限',
                      success: (modalRes) => {
                        if (modalRes.confirm) {
                          wx.openSetting();
                        }
                      }
                    });
                  } else {
                    wx.showToast({ 
                      title: '保存失败', 
                      icon: 'none' 
                    });
                  }
                }
              });
            } else if (res.tapIndex === 1) {
              // 预览图片
              wx.previewImage({
                urls: [tempFilePath],
                current: tempFilePath
              });
            }
          }
        });
      });
    } catch (error) {
      wx.hideLoading();
      console.error('生成海报出错:', error);
      wx.showToast({ 
        title: '生成失败', 
        icon: 'none' 
      });
    }
  }
});
