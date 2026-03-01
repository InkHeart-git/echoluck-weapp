// utils/dailyTaskEval.js
// 每日行动评估系统

const { getTaskType } = require('./taskTypes.js');

// 善行评分标准（AI评估基准）
const EVALUATION_CRITERIA = {
  // 温暖传递的评分维度
  help: {
    timeSpent: {      // 花费时间
      '5-15分钟': 5,
      '15-30分钟': 10,
      '30-60分钟': 15,
      '1小时以上': 20
    },
    impactLevel: {    // 影响程度
      '轻微影响': 5,
      '一般影响': 10,
      '重要影响': 15,
      '重大影响': 20
    },
    difficulty: {     // 难度
      '非常简单': 2,
      '比较简单': 5,
      '有一定难度': 8,
      '比较困难': 12
    }
  },
  
  // 爱心捐赠
  donate: {
    amount: {         // 金额/价值
      '小额(1-10元)': 5,
      '中等(10-50元)': 10,
      '较多(50-100元)': 15,
      '大额(100元以上)': 25
    },
    target: {         // 对象
      '个人求助': 8,
      '公益组织': 10,
      '紧急救援': 15,
      '长期项目': 12
    }
  },
  
  // 救助动物
  animal: {
    actionType: {     // 行动类型
      '喂食': 5,
      '救助': 15,
      '领养': 25,
      '绝育/医疗': 20
    },
    animalCount: {    // 动物数量
      '1只': 5,
      '2-3只': 10,
      '4-5只': 15,
      '5只以上': 20
    }
  },
  
  // 阅读学习
  read: {
    duration: {       // 时长
      '15-30分钟': 5,
      '30-60分钟': 10,
      '1-2小时': 15,
      '2小时以上': 20
    },
    contentType: {    // 内容类型
      '休闲阅读': 5,
      '专业学习': 12,
      '技能提升': 15,
      '深度研究': 18
    }
  },
  
  // 运动健康
  exercise: {
    duration: {
      '15-30分钟': 5,
      '30-45分钟': 10,
      '45-60分钟': 15,
      '1小时以上': 20
    },
    intensity: {      // 强度
      '轻度': 5,
      '中度': 10,
      '高强度': 15,
      '极限': 20
    }
  },
  
  // 环保行动
  eco: {
    actionType: {
      '垃圾分类': 3,
      '捡拾垃圾': 8,
      '减少塑料': 5,
      '绿色出行': 10,
      '植树造林': 20
    },
    scope: {          // 范围
      '个人': 3,
      '家庭': 5,
      '社区': 10,
      '更大范围': 15
    }
  },
  
  // 创作输出
  create: {
    contentLength: {  // 内容长度
      '短内容': 5,
      '中等内容': 10,
      '长内容': 15,
      '系列内容': 20
    },
    quality: {        // 质量
      '普通分享': 5,
      '精心制作': 12,
      '专业水准': 18,
      '精品': 25
    }
  },
  
  // 自我关怀
  selfcare: {
    duration: {       // 时长
      '5-15分钟': 5,
      '15-30分钟': 10,
      '30-60分钟': 15,
      '1小时以上': 20
    },
    relaxation: {     // 放松程度
      '轻微放松': 5,
      '比较放松': 10,
      '深度放松': 15,
      '完全恢复': 20
    },
    difficulty: {     // 难度
      '非常简单': 2,
      '比较简单': 5,
      '需要专注': 8,
      '需要坚持': 12
    }
  }
};

// 计算单次行动的分数
function calculateDailyScore(taskType, answers) {
  const criteria = EVALUATION_CRITERIA[taskType];
  if (!criteria) return 10; // 默认分数
  
  let totalScore = 0;
  let maxPossible = 0;
  
  for (const [dimension, options] of Object.entries(criteria)) {
    const userAnswer = answers[dimension];
    const score = options[userAnswer] || 0;
    totalScore += score;
    
    // 计算该维度最高分
    const maxInDimension = Math.max(...Object.values(options));
    maxPossible += maxInDimension;
  }
  
  // 基础分 + 实际得分
  const baseScore = 5;
  const normalizedScore = Math.round((totalScore / maxPossible) * 30);
  
  return baseScore + normalizedScore;
}

// 获取评估问题
function getEvaluationQuestions(taskType) {
  const criteria = EVALUATION_CRITERIA[taskType];
  if (!criteria) return [];
  
  const questions = [];
  
  for (const [dimension, options] of Object.entries(criteria)) {
    const questionText = getDimensionText(taskType, dimension);
    const optionsList = Object.keys(options).map((key, index) => ({
      label: key,
      value: key,
      icon: ['⭐', '🌟', '✨', '💫'][index] || '⭐'
    }));
    
    questions.push({
      dimension: dimension,
      question: questionText,
      options: optionsList
    });
  }
  
  return questions;
}

// 维度文字说明
function getDimensionText(taskType, dimension) {
  const texts = {
    help: {
      timeSpent: '这件事对你自己或周围的影响？',
      impactLevel: '产生的积极影响程度？',
      difficulty: '完成这件事的难度？'
    },
    donate: {
      amount: '捐赠金额/价值？',
      target: '捐赠对象类型？'
    },
    animal: {
      actionType: '你做了什么？',
      animalCount: '接触了多少动物？'
    },
    read: {
      duration: '学习时长？',
      contentType: '学习内容类型？'
    },
    exercise: {
      duration: '运动时长？',
      intensity: '运动强度？'
    },
    eco: {
      actionType: '具体行动？',
      scope: '影响范围？'
    },
    create: {
      contentLength: '内容长度？',
      quality: '内容质量？'
    },
    selfcare: {
      duration: '关怀时长？',
      relaxation: '放松程度？',
      difficulty: '完成难度？'
    }
  };
  
  return texts[taskType]?.[dimension] || dimension;
}

// 超额完成奖励计算
function calculateBonus(currentPoints, targetPoints) {
  const ratio = currentPoints / targetPoints;
  
  if (ratio >= 2.0) {
    return {
      level: 'legendary',
      name: '传说级完成',
      bonus: Math.floor(targetPoints * 0.5), // 额外50%
      message: '太不可思议了！你完成了双倍目标！'
    };
  } else if (ratio >= 1.5) {
    return {
      level: 'epic',
      name: '史诗级完成',
      bonus: Math.floor(targetPoints * 0.3), // 额外30%
      message: '超额完成50%！太棒了！'
    };
  } else if (ratio >= 1.2) {
    return {
      level: 'rare',
      name: '优秀完成',
      bonus: Math.floor(targetPoints * 0.15), // 额外15%
      message: '超额完成20%，继续加油！'
    };
  }
  
  return null;
}

// 获取鼓励语
function getEncouragement(streak, totalPoints) {
  const encouragements = [
    '每一份努力都在让自己变得更好！',
    '你正在成为一个更优秀的人！',
    '坚持积累，收获自来！',
    '今天的付出，明天的收获！',
    '你的行动让今天更有意义！'
  ];
  
  if (streak >= 7) {
    return '连续7天坚持，你已经是行动的专家了！';
  } else if (streak >= 3) {
    return '连续3天，好习惯正在养成！';
  } else if (totalPoints > 1000) {
    return '积分破千，你是真正的行动派！';
  }
  
  return encouragements[Math.floor(Math.random() * encouragements.length)];
}

module.exports = {
  calculateDailyScore,
  getEvaluationQuestions,
  calculateBonus,
  getEncouragement,
  EVALUATION_CRITERIA
};
