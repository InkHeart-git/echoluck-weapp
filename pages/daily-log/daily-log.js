// pages/daily-log/daily-log.js - 优化版
const { getTaskTypeList, getTaskType, getTaskActions } = require('../../utils/taskTypes.js');
const { calculateDailyScore, getEvaluationQuestions, getEncouragement, getScoreExplanation } = require('../../utils/dailyTaskEval.js');
const { getLocalDateString } = require('../../utils/dateHelper.js');

Page({
  data: {
    capsuleId: '',
    capsule: null,
    
    // 行动类型选择
    taskTypes: [],
    selectedTaskType: '',
    
    // 具体行动选择
    taskActions: [],
    selectedActions: [],
    showCustomInput: false,
    customAction: '',
    
    // 评估相关
    taskType: null,
    questions: [],
    answers: {},
    
    // 步骤控制
    currentStep: 0, // 0=选择行动类型, 1=选择具体行动, 2=补充描述, 3=评估得分
    
    // 用户输入
    description: '',
    quickTags: ['感觉很棒', '有点累但值得', '坚持就是胜利', '今天状态很好', '完成了目标', '学到了新东西'],
    todayScore: 0,
    isSubmitting: false,
    
    // 按钮状态
    canProceed: false,
    canSubmit: false
  },

  onLoad(options) {
    const { id } = options;
    const capsules = wx.getStorageSync('echoluck_capsules') || [];
    const capsule = capsules.find(c => c.id === id);
    
    if (!capsule) {
      wx.showToast({ title: '胶囊不存在', icon: 'error' });
      wx.navigateBack();
      return;
    }

    // 加载所有行动类型
    const taskTypes = getTaskTypeList();

    this.setData({
      capsuleId: id,
      capsule: capsule,
      taskTypes: taskTypes,
      currentStep: 0,
      canProceed: false
    });
  },

  // 检查是否可以继续
  checkCanProceed() {
    const { currentStep, selectedTaskType, selectedActions, description, answers, questions } = this.data;
    let canProceed = false;
    
    switch(currentStep) {
      case 0:
        canProceed = !!selectedTaskType;
        break;
      case 1:
        canProceed = selectedActions.length > 0;
        break;
      case 2:
        canProceed = true; // 描述是可选的
        break;
      case 3:
        canProceed = Object.keys(answers).length === questions.length;
        break;
    }
    
    this.setData({ 
      canProceed,
      canSubmit: Object.keys(answers).length === questions.length
    });
  },

  // 选择行动类型
  selectTaskType(e) {
    console.log('selectTaskType called', e.currentTarget.dataset);
    const typeId = e.currentTarget.dataset.type;
    console.log('typeId:', typeId);
    const taskType = getTaskType(typeId);
    console.log('taskType:', taskType);
    const taskActions = getTaskActions(typeId).map(action => ({
      ...action,
      selected: false
    }));
    console.log('taskActions:', taskActions);
    
    this.setData({
      selectedTaskType: typeId,
      taskType: taskType,
      taskActions: taskActions,
      selectedActions: [],
      description: '',
      customAction: '',
      showCustomInput: false,
      answers: {},
      todayScore: 0
    }, () => {
      this.checkCanProceed();
      // 自动进入下一步
      setTimeout(() => this.nextStep(), 300);
    });
  },

  // 选择/取消选择具体行动
  selectAction(e) {
    const actionId = e.currentTarget.dataset.id;
    const { taskActions, selectedActions } = this.data;
    
    const actionIndex = taskActions.findIndex(a => a.id === actionId);
    if (actionIndex === -1) return;
    
    const action = taskActions[actionIndex];
    const isSelected = !action.selected;
    
    // 更新行动列表
    taskActions[actionIndex].selected = isSelected;
    
    // 更新已选列表
    let newSelectedActions;
    if (isSelected) {
      newSelectedActions = [...selectedActions, action];
    } else {
      newSelectedActions = selectedActions.filter(a => a.id !== actionId);
    }
    
    // 更新描述
    const description = this.buildDescription(newSelectedActions);
    
    this.setData({
      taskActions: [...taskActions],
      selectedActions: newSelectedActions,
      description: description
    }, () => {
      this.checkCanProceed();
    });
  },

  // 移除已选行动
  removeAction(e) {
    const actionId = e.currentTarget.dataset.id;
    const { taskActions, selectedActions } = this.data;
    
    // 更新行动列表
    const actionIndex = taskActions.findIndex(a => a.id === actionId);
    if (actionIndex !== -1) {
      taskActions[actionIndex].selected = false;
    }
    
    // 更新已选列表
    const newSelectedActions = selectedActions.filter(a => a.id !== actionId);
    
    // 更新描述
    const description = this.buildDescription(newSelectedActions);
    
    this.setData({
      taskActions: [...taskActions],
      selectedActions: newSelectedActions,
      description: description
    }, () => {
      this.checkCanProceed();
    });
  },

  // 构建描述文本
  buildDescription(actions) {
    if (actions.length === 0) return '';
    return actions.map(a => `${a.icon} ${a.name}: ${a.desc}`).join('\n');
  },

  // 切换自定义输入
  toggleCustomInput() {
    this.setData({
      showCustomInput: !this.data.showCustomInput
    });
  },

  // 输入自定义行动
  onCustomActionInput(e) {
    this.setData({ customAction: e.detail.value });
  },

  // 添加自定义行动
  addCustomAction() {
    const { customAction, selectedActions } = this.data;
    if (!customAction.trim()) {
      wx.showToast({ title: '请输入行动内容', icon: 'none' });
      return;
    }
    
    const customId = 'custom_' + Date.now();
    const newAction = {
      id: customId,
      icon: '✏️',
      name: customAction.trim(),
      desc: '自定义行动',
      selected: true,
      isCustom: true
    };
    
    this.setData({
      selectedActions: [...selectedActions, newAction],
      customAction: '',
      description: this.data.description + (this.data.description ? '\n' : '') + `✏️ ${newAction.name}`
    }, () => {
      this.checkCanProceed();
      wx.showToast({ title: '已添加', icon: 'success' });
    });
  },

  // 输入描述
  onDescriptionInput(e) {
    this.setData({ description: e.detail.value });
  },

  // 添加快捷标签
  addQuickTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const { description } = this.data;
    const newDesc = description ? `${description}\n${tag}` : tag;
    this.setData({ description: newDesc });
  },

  // 选择答案
  selectAnswer(e) {
    const { dimension, option } = e.currentTarget.dataset;
    const answers = { ...this.data.answers, [dimension]: option };
    
    this.setData({ answers }, () => {
      // 计算当前得分
      this.calculateScore();
      this.checkCanProceed();
    });
  },

  // 计算得分（增强版 - 智能评分）
  calculateScore() {
    const app = getApp();
    const { selectedTaskType, answers, description } = this.data;
    
    // 获取连续打卡天数
    const streakDays = app.globalData.streak?.current || 0;
    
    // 获取今天已完成的任务类型（简化处理，实际应从存储中读取）
    const todayCompletedTypes = this.getTodayCompletedTypes();
    
    const score = calculateDailyScore(
      selectedTaskType, 
      answers, 
      description,
      streakDays,
      todayCompletedTypes
    );
    
    this.setData({ todayScore: score });
    return score;
  },
  
  // 获取今天已完成的任务类型
  getTodayCompletedTypes() {
    const { capsuleId } = this.data;
    const capsules = wx.getStorageSync('echoluck_capsules') || [];
    const capsule = capsules.find(c => c.id === capsuleId);
    
    if (!capsule || !capsule.dailyLogs) return [];
    
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = capsule.dailyLogs.filter(log => log.date === today);
    
    return todayLogs.map(log => log.taskType);
  },

  // 下一步
  nextStep() {
    const { currentStep, selectedTaskType, selectedActions, description, answers, questions } = this.data;
    
    if (currentStep === 0) {
      if (!selectedTaskType) {
        wx.showToast({ title: '请选择行动类型', icon: 'none' });
        return;
      }
      this.setData({ currentStep: 1 });
    } else if (currentStep === 1) {
      if (selectedActions.length === 0) {
        wx.showToast({ title: '请选择至少一个具体行动', icon: 'none' });
        return;
      }
      this.setData({ currentStep: 2 });
    } else if (currentStep === 2) {
      // 获取评估问题
      const questions = getEvaluationQuestions(selectedTaskType);
      this.setData({ 
        currentStep: 3,
        questions: questions,
        answers: {}
      });
    } else if (currentStep === 3) {
      // 检查是否回答了所有问题
      if (Object.keys(answers).length < questions.length) {
        wx.showToast({ title: '请回答所有问题', icon: 'none' });
        return;
      }
      // 提交记录
      this.submitLog();
    }
  },

  // 上一步
  prevStep() {
    const { currentStep } = this.data;
    if (currentStep === 0) {
      wx.navigateBack();
    } else if (currentStep === 1) {
      this.setData({ 
        currentStep: 0,
        selectedTaskType: '',
        taskType: null,
        taskActions: [],
        selectedActions: []
      }, () => this.checkCanProceed());
    } else if (currentStep === 2) {
      this.setData({ currentStep: 1 });
    } else if (currentStep === 3) {
      this.setData({ 
        currentStep: 2,
        answers: {},
        todayScore: 0
      }, () => this.checkCanProceed());
    }
  },

  // 提交记录
  submitLog() {
    if (this.data.isSubmitting) return;
    
    const { answers, questions } = this.data;
    if (Object.keys(answers).length < questions.length) {
      wx.showToast({ title: '请回答所有问题', icon: 'none' });
      return;
    }
    
    this.setData({ isSubmitting: true });

    const { capsuleId, description, todayScore, capsule, selectedTaskType, taskType, selectedActions } = this.data;
    const capsules = wx.getStorageSync('echoluck_capsules') || [];
    const index = capsules.findIndex(c => c.id === capsuleId);
    
    if (index === -1) {
      wx.showToast({ title: '提交失败', icon: 'error' });
      this.setData({ isSubmitting: false });
      return;
    }

    // 创建每日记录
    const dailyLog = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('zh-CN'),
      timestamp: Date.now(),
      taskType: selectedTaskType,
      taskTypeName: taskType.name,
      taskTypeIcon: taskType.icon,
      actions: selectedActions.map(a => ({
        id: a.id,
        name: a.name,
        icon: a.icon,
        isCustom: a.isCustom || false
      })),
      description: description,
      answers: answers,
      score: todayScore
    };

    // 更新胶囊
    const updatedCapsule = capsules[index];
    updatedCapsule.dailyLogs = updatedCapsule.dailyLogs || [];
    updatedCapsule.dailyLogs.push(dailyLog);
    updatedCapsule.currentPoints = (updatedCapsule.currentPoints || 0) + todayScore;
    updatedCapsule.progress = Math.min(100, Math.round((updatedCapsule.currentPoints / updatedCapsule.points) * 100));
    updatedCapsule.lastLogDate = new Date().toISOString().split('T')[0];

    // 检查是否完成
    const isComplete = updatedCapsule.currentPoints >= updatedCapsule.points;
    
    capsules[index] = updatedCapsule;
    wx.setStorageSync('echoluck_capsules', capsules);

    // 更新全局数据
    const app = getApp();
    app.globalData.totalPoints = (app.globalData.totalPoints || 0) + todayScore;
    app.globalData.completedTasks = (app.globalData.completedTasks || 0) + 1;
    app.globalData.streak = app.globalData.streak || { current: 0, lastDate: '' };
    
    // 更新连续打卡
    const today = getLocalDateString();
    const lastDate = app.globalData.streak.lastDate;
    
    if (lastDate) {
      const last = new Date(lastDate);
      const todayObj = new Date(today);
      const diff = (todayObj - last) / (1000 * 60 * 60 * 24);
      
      if (diff === 1) {
        app.globalData.streak.current++;
      } else if (diff > 1) {
        app.globalData.streak.current = 1;
      }
    } else {
      app.globalData.streak.current = 1;
    }
    
    app.globalData.streak.lastDate = today;
    app.saveGlobalData();

    // 播放打卡成功动画
    app.playCheckInAnimation(todayScore);

    // 获取鼓励语
    const encouragement = getEncouragement(app.globalData.streak.current, app.globalData.totalPoints);
    
    // 获取评分解释
    const { description, selectedTaskType, answers } = this.data;
    const streakDays = app.globalData.streak?.current || 0;
    const todayCompletedTypes = this.getTodayCompletedTypes();
    
    // 计算各项加成
    const keywordBonus = this.calculateKeywordBonus(description);
    const streakMultiplier = this.getStreakMultiplier(streakDays);
    const comboBonus = this.calculateComboBonus(selectedTaskType, todayCompletedTypes);
    
    const scoreExplanations = getScoreExplanation(todayScore, keywordBonus, streakMultiplier, comboBonus);

    // 延迟后显示结果
    setTimeout(() => {
      this.setData({ isSubmitting: false });
      
      if (isComplete) {
        // 播放愿望完成动画
        app.playWishCompleteAnimation(capsule.wish, updatedCapsule.currentPoints);
        setTimeout(() => {
          wx.navigateBack();
        }, 2000);
      } else {
        // 构建详细得分信息
        let content = `${encouragement}\n\n`;
        content += `📊 今日得分：+${todayScore} 分\n`;
        
        // 添加评分解释
        if (scoreExplanations.length > 0) {
          content += `\n✨ 加分详情：\n`;
          scoreExplanations.forEach(exp => {
            content += `   ${exp}\n`;
          });
        }
        
        content += `\n📈 当前进度：${updatedCapsule.currentPoints}/${updatedCapsule.points} (${updatedCapsule.progress}%)\n`;
        content += `🔥 连续打卡：${app.globalData.streak.current} 天`;
        
        wx.showModal({
          title: '打卡成功！🎉',
          content: content,
          showCancel: true,
          cancelText: '返回',
          confirmText: '分享海报',
          success: (res) => {
            if (res.confirm) {
              // 跳转到海报页面
              this.showPoster();
            } else {
              wx.navigateBack();
            }
          }
        });
      }
    }, 1500);
  },
  
  // 计算关键词加分（用于显示）
  calculateKeywordBonus(description) {
    if (!description) return 0;
    const keywords = ['坚持', '连续', '突破', '克服', '感动', '有意义', '帮助'];
    let bonus = 0;
    keywords.forEach(word => {
      if (description.includes(word)) bonus += 5;
    });
    return Math.min(20, bonus);
  },
  
  // 获取连续打卡加成
  getStreakMultiplier(streakDays) {
    if (streakDays >= 30) return 1.30;
    if (streakDays >= 14) return 1.20;
    if (streakDays >= 7) return 1.10;
    if (streakDays >= 3) return 1.05;
    return 1.00;
  },
  
  // 计算组合加分
  calculateComboBonus(currentType, todayCompletedTypes) {
    if (!todayCompletedTypes || todayCompletedTypes.length === 0) return 0;
    
    let bonus = 0;
    const hasType = (type) => todayCompletedTypes.includes(type);
    
    if ((currentType === 'exercise' && hasType('selfcare')) ||
        (currentType === 'selfcare' && hasType('exercise'))) {
      bonus += 8;
    }
    
    if ((currentType === 'read' && hasType('create')) ||
        (currentType === 'create' && hasType('read'))) {
      bonus += 10;
    }
    
    const allTypes = [...new Set([...todayCompletedTypes, currentType])];
    if (allTypes.length >= 3) bonus += 15;
    if (allTypes.length >= 5) bonus += 20;
    
    return bonus;
  },

  // 显示完成对话框
  showCompleteDialog(capsule) {
    const { calculateBonus } = require('../../utils/dailyTaskEval.js');
    const bonus = calculateBonus(capsule.currentPoints, capsule.points);
    
    let content = `恭喜你完成了「${capsule.wish}」！\n\n`;
    content += `目标积分：${capsule.points}\n`;
    content += `实际积分：${capsule.currentPoints}\n`;
    
    if (bonus) {
      content += `\n🎉 ${bonus.name}！\n`;
      content += `额外奖励：+${bonus.bonus} 积分`;
    }

    wx.showModal({
      title: '胶囊完成！🎊',
      content: content,
      confirmText: '领取奖励',
      cancelText: '继续积累',
      success: (res) => {
        if (res.confirm) {
          this.finishCapsule(bonus);
        } else {
          wx.navigateBack();
        }
      }
    });
  },

  // 完成胶囊
  finishCapsule(bonus) {
    const app = getApp();
    const { capsuleId, capsule } = this.data;
    const capsules = wx.getStorageSync('echoluck_capsules') || [];
    const index = capsules.findIndex(c => c.id === capsuleId);
    
    if (index === -1) return;

    const finalPoints = capsule.points + (bonus ? bonus.bonus : 0);
    
    // 标记完成
    capsules[index].completed = true;
    capsules[index].completedAt = new Date().toISOString();
    capsules[index].finalPoints = finalPoints;
    capsules[index].bonusLevel = bonus ? bonus.level : 'normal';
    
    wx.setStorageSync('echoluck_capsules', capsules);

    // 增加总积分
    app.globalData.totalPoints += (bonus ? bonus.bonus : 0);
    app.globalData.completedWishes = (app.globalData.completedWishes || 0) + 1;
    app.saveGlobalData();

    wx.showToast({
      title: `获得 ${finalPoints} 积分！`,
      icon: 'success',
      duration: 2000
    });

    setTimeout(() => {
      wx.switchTab({ url: '/pages/dashboard/dashboard' });
    }, 1500);
  },
  
  // 显示海报分享
  showPoster() {
    const { taskType, selectedActions, description, todayScore, capsule } = this.data;
    const app = getApp();
    
    const actionsStr = encodeURIComponent(JSON.stringify(selectedActions.map(a => ({
      name: a.name,
      icon: a.icon
    }))));
    
    wx.navigateTo({
      url: `/pages/poster/poster?` +
        `capsuleName=${encodeURIComponent(capsule?.wish || '我的愿望打卡本')}` +
        `&taskTypeName=${encodeURIComponent(taskType?.name || '日常打卡')}` +
        `&taskTypeIcon=${encodeURIComponent(taskType?.icon || '✨')}` +
        `&taskTypeColor=${encodeURIComponent(taskType?.color || '#6366f1')}` +
        `&actions=${actionsStr}` +
        `&description=${encodeURIComponent(description)}` +
        `&score=${todayScore}` +
        `&date=${new Date().toISOString().split('T')[0]}`
    });
  }
});
