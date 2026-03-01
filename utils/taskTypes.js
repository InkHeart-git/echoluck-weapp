// utils/taskTypes.js
// 任务类型定义 - 优化版

const TASK_TYPES = {
  help: {
    id: 'help',
    name: '温暖传递',
    icon: '🤝',
    description: '传递温暖与关怀',
    color: '#FF6B9D',
    gradient: 'linear-gradient(135deg, #FF6B9D, #FF8EAB)',
    examples: ['问候家人朋友', '整理自己的房间', '给自己做顿美食', '记录今日心情'],
    basePoints: { easy: 50, medium: 150, hard: 400 },
    actions: [
      { id: 'greet', icon: '💌', name: '问候家人', desc: '给家人打电话或发信息' },
      { id: 'clean', icon: '🏠', name: '整理房间', desc: '打扫居住环境' },
      { id: 'cook', icon: '🍳', name: '烹饪美食', desc: '为自己或家人做顿好吃的' },
      { id: 'journal', icon: '📝', name: '记录心情', desc: '写日记或心情笔记' },
      { id: 'gift', icon: '🎁', name: '准备礼物', desc: '为他人准备惊喜' },
      { id: 'listen', icon: '💬', name: '倾听陪伴', desc: '花时间陪伴重要的人' }
    ]
  },
  donate: {
    id: 'donate',
    name: '公益参与',
    icon: '💝',
    description: '参与公益活动，贡献一份力量',
    color: '#FF6B6B',
    gradient: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)',
    examples: ['参与公益项目', '整理闲置物品', '关注环保议题', '参与社区活动'],
    basePoints: { easy: 80, medium: 200, hard: 500 },
    actions: [
      { id: 'volunteer', icon: '🎯', name: '公益项目', desc: '参与志愿服务' },
      { id: 'donate_items', icon: '📦', name: '整理捐赠', desc: '整理闲置物品捐赠' },
      { id: 'eco_aware', icon: '🌍', name: '关注环保', desc: '了解环保议题' },
      { id: 'community', icon: '👥', name: '社区活动', desc: '参与社区建设' },
      { id: 'blood', icon: '🩸', name: '爱心献血', desc: '参与无偿献血' },
      { id: 'help_stranger', icon: '🤲', name: '帮助陌生人', desc: '力所能及帮助他人' }
    ]
  },
  animal: {
    id: 'animal',
    name: '关爱动物',
    icon: '🐾',
    description: '关注和照顾动物',
    color: '#C19A6B',
    gradient: 'linear-gradient(135deg, #C19A6B, #D4B896)',
    examples: ['观察身边的动物', '了解动物保护知识', '给宠物梳理毛发', '参与动物保护宣传'],
    basePoints: { easy: 60, medium: 180, hard: 450 },
    actions: [
      { id: 'walk_dog', icon: '🐕', name: '遛狗陪伴', desc: '带宠物外出活动' },
      { id: 'pet_care', icon: '🐱', name: '宠物护理', desc: '给宠物梳理毛发' },
      { id: 'bird_watch', icon: '🦜', name: '观察鸟类', desc: '观察记录身边的鸟类' },
      { id: 'learn_animal', icon: '📖', name: '学习知识', desc: '学习动物保护知识' },
      { id: 'rescue', icon: '🏥', name: '救助动物', desc: '帮助受伤的小动物' },
      { id: 'advocate', icon: '📢', name: '保护宣传', desc: '参与动物保护宣传' }
    ]
  },
  read: {
    id: 'read',
    name: '阅读学习',
    icon: '📚',
    description: '阅读书籍或学习新技能',
    color: '#4A90D9',
    gradient: 'linear-gradient(135deg, #4A90D9, #7AB8E8)',
    examples: ['读完一本书', '学习新技能', '听一门课程', '读完专业文献'],
    basePoints: { easy: 40, medium: 120, hard: 350 },
    actions: [
      { id: 'finish_book', icon: '📖', name: '读完一本书', desc: '完成一本书的阅读' },
      { id: 'learn_skill', icon: '🎓', name: '学习技能', desc: '学习新的技能或知识' },
      { id: 'audio_course', icon: '🎧', name: '听课程', desc: '完成一节音频课程' },
      { id: 'paper', icon: '🔬', name: '专业文献', desc: '阅读专业领域文献' },
      { id: 'language', icon: '🌐', name: '学语言', desc: '学习外语' },
      { id: 'coding', icon: '💻', name: '编程学习', desc: '学习编程或技术' }
    ]
  },
  exercise: {
    id: 'exercise',
    name: '运动健康',
    icon: '💪',
    description: '运动锻炼保持健康',
    color: '#52C41A',
    gradient: 'linear-gradient(135deg, #52C41A, #7ED957)',
    examples: ['跑步5公里', '健身30分钟', '瑜伽/冥想', '坚持早起'],
    basePoints: { easy: 30, medium: 100, hard: 300 },
    actions: [
      { id: 'run', icon: '🏃', name: '跑步运动', desc: '跑步或快走' },
      { id: 'gym', icon: '🏋️', name: '力量训练', desc: '健身或力量训练' },
      { id: 'yoga', icon: '🧘', name: '瑜伽冥想', desc: '瑜伽或冥想练习' },
      { id: 'early', icon: '🌅', name: '早起习惯', desc: '坚持早起' },
      { id: 'swim', icon: '🏊', name: '游泳运动', desc: '游泳锻炼' },
      { id: 'cycle', icon: '🚴', name: '骑行锻炼', desc: '骑自行车运动' }
    ]
  },
  eco: {
    id: 'eco',
    name: '环保行动',
    icon: '🌱',
    description: '保护环境的行为',
    color: '#36CFC9',
    gradient: 'linear-gradient(135deg, #36CFC9, #5CDBD3)',
    examples: ['垃圾分类', '捡拾垃圾', '减少塑料使用', '绿色出行'],
    basePoints: { easy: 35, medium: 110, hard: 320 },
    actions: [
      { id: 'sort_waste', icon: '♻️', name: '垃圾分类', desc: '正确进行垃圾分类' },
      { id: 'pick_trash', icon: '🗑️', name: '捡拾垃圾', desc: '清理环境中的垃圾' },
      { id: 'no_plastic', icon: '🛍️', name: '减少塑料', desc: '减少一次性塑料使用' },
      { id: 'green_travel', icon: '🚶', name: '绿色出行', desc: '步行或骑行出行' },
      { id: 'save_water', icon: '💧', name: '节约用水', desc: '注意节约用水' },
      { id: 'save_elec', icon: '⚡', name: '节约用电', desc: '注意节约用电' }
    ]
  },
  create: {
    id: 'create',
    name: '创作输出',
    icon: '✨',
    description: '创作内容或分享知识',
    color: '#A855F7',
    gradient: 'linear-gradient(135deg, #A855F7, #C084FC)',
    examples: ['写一篇博客', '录制教学视频', '分享读书笔记', '制作手工艺品'],
    basePoints: { easy: 45, medium: 140, hard: 380 },
    actions: [
      { id: 'write', icon: '✍️', name: '写文章', desc: '写一篇博客或文章' },
      { id: 'video', icon: '🎥', name: '录视频', desc: '录制教学或分享视频' },
      { id: 'notes', icon: '📖', name: '读书笔记', desc: '分享阅读笔记' },
      { id: 'craft', icon: '🎨', name: '手工艺品', desc: '制作手工作品' },
      { id: 'photo', icon: '📸', name: '摄影创作', desc: '拍摄照片作品' },
      { id: 'music', icon: '🎵', name: '音乐创作', desc: '创作或演奏音乐' }
    ]
  },
  selfcare: {
    id: 'selfcare',
    name: '自我关怀',
    icon: '🧘',
    description: '关爱自己的身心健康',
    color: '#E91E63',
    gradient: 'linear-gradient(135deg, #E91E63, #F48FB1)',
    examples: ['冥想放松', '早睡早起', '健康饮食', '护肤保养'],
    basePoints: { easy: 25, medium: 80, hard: 200 },
    actions: [
      { id: 'meditate', icon: '🧘‍♀️', name: '冥想放松', desc: '进行冥想或深呼吸练习' },
      { id: 'sleep_early', icon: '😴', name: '早睡早起', desc: '保持规律作息' },
      { id: 'healthy_eat', icon: '🥗', name: '健康饮食', desc: '吃营养均衡的餐食' },
      { id: 'skincare', icon: '💆', name: '护肤保养', desc: '进行日常护肤' },
      { id: 'spa', icon: '🛁', name: '放松沐浴', desc: '泡个热水澡放松身心' },
      { id: 'hobby', icon: '🎮', name: '兴趣爱好', desc: '做自己喜欢的事情' }
    ]
  }
};

// 获取任务类型列表
function getTaskTypeList() {
  return Object.values(TASK_TYPES);
}

// 根据ID获取任务类型
function getTaskType(id) {
  return TASK_TYPES[id] || null;
}

// 获取任务类型的具体行动列表
function getTaskActions(taskTypeId) {
  const taskType = TASK_TYPES[taskTypeId];
  return taskType ? taskType.actions : [];
}

// 获取具体行动详情
function getTaskAction(taskTypeId, actionId) {
  const taskType = TASK_TYPES[taskTypeId];
  if (!taskType) return null;
  return taskType.actions.find(action => action.id === actionId) || null;
}

// 计算任务积分
function calculatePoints(taskTypeId, difficulty, days) {
  const taskType = TASK_TYPES[taskTypeId];
  if (!taskType) return 100;
  
  const basePoints = taskType.basePoints[difficulty] || 100;
  const dayMultiplier = Math.min(days / 7, 3); // 天数越长，积分越高，最高3倍
  
  return Math.floor(basePoints * (1 + dayMultiplier * 0.2));
}

// 获取随机任务示例
function getRandomExample(taskTypeId) {
  const taskType = TASK_TYPES[taskTypeId];
  if (!taskType) return '';
  const examples = taskType.examples;
  return examples[Math.floor(Math.random() * examples.length)];
}

module.exports = {
  TASK_TYPES,
  getTaskTypeList,
  getTaskType,
  getTaskActions,
  getTaskAction,
  calculatePoints,
  getRandomExample
};
