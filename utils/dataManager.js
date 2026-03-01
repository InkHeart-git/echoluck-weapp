/**
 * 数据管理器 - 统一小程序数据存储与缓存
 * 提供规范化的 Storage API 封装、数据缓存和连续打卡算法
 * @version 1.0.0
 */

// Storage Key 常量定义（统一命名规范）
const STORAGE_KEYS = {
  TOTAL_POINTS: 'echoluck_total_points',
  COMPLETED_TASKS: 'echoluck_completed_tasks',
  COMPLETED_WISHES: 'echoluck_completed_wishes',
  STREAK: 'echoluck_streak',
  CAPSULES: 'echoluck_capsules',
  CHECKIN_RECORDS: 'checkin_records',
  REFRESH_COUNT: 'echoluck_refresh_count',
  LAST_REFRESH: 'echoluck_last_refresh',
  DAILY_TASKS: 'echoluck_daily_tasks',
  USER_INFO: 'echoluck_user_info',
  SETTINGS: 'echoluck_settings'
};

// 缓存配置
const CACHE_CONFIG = {
  // 缓存有效期（毫秒）
  TTL: {
    CAPSULES: 5 * 60 * 1000,      // 5分钟
    STATS: 30 * 1000,              // 30秒
    CHECKIN_RECORDS: 60 * 1000,    // 1分钟
    STREAK: 10 * 1000              // 10秒
  }
};

/**
 * 数据缓存管理器
 */
class DataCache {
  constructor() {
    this._cache = new Map();
    this._timestamps = new Map();
  }

  /**
   * 获取缓存数据
   * @param {string} key - 缓存键
   * @param {number} ttl - 有效期（毫秒）
   * @returns {any|null} 缓存数据或null
   */
  get(key, ttl = 60000) {
    const timestamp = this._timestamps.get(key);
    if (!timestamp) return null;

    const now = Date.now();
    if (now - timestamp > ttl) {
      // 缓存过期
      this.delete(key);
      return null;
    }

    return this._cache.get(key);
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   */
  set(key, value) {
    this._cache.set(key, value);
    this._timestamps.set(key, Date.now());
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  delete(key) {
    this._cache.delete(key);
    this._timestamps.delete(key);
  }

  /**
   * 清空缓存
   */
  clear() {
    this._cache.clear();
    this._timestamps.clear();
  }

  /**
   * 检查缓存是否有效
   * @param {string} key - 缓存键
   * @param {number} ttl - 有效期
   * @returns {boolean}
   */
  isValid(key, ttl = 60000) {
    const timestamp = this._timestamps.get(key);
    if (!timestamp) return false;
    return (Date.now() - timestamp) <= ttl;
  }
}

// 全局缓存实例
const globalCache = new DataCache();

/**
 * Storage API 封装
 */
const Storage = {
  /**
   * 同步获取数据
   * @param {string} key - Storage key
   * @param {any} defaultValue - 默认值
   * @returns {any}
   */
  get(key, defaultValue = null) {
    try {
      const value = wx.getStorageSync(key);
      return value !== undefined && value !== null ? value : defaultValue;
    } catch (e) {
      console.warn(`[Storage.get] 读取失败: ${key}`, e);
      return defaultValue;
    }
  },

  /**
   * 同步设置数据
   * @param {string} key - Storage key
   * @param {any} value - 存储值
   * @returns {boolean} 是否成功
   */
  set(key, value) {
    try {
      wx.setStorageSync(key, value);
      return true;
    } catch (e) {
      console.warn(`[Storage.set] 写入失败: ${key}`, e);
      return false;
    }
  },

  /**
   * 同步删除数据
   * @param {string} key - Storage key
   * @returns {boolean}
   */
  remove(key) {
    try {
      wx.removeStorageSync(key);
      return true;
    } catch (e) {
      console.warn(`[Storage.remove] 删除失败: ${key}`, e);
      return false;
    }
  },

  /**
   * 获取JSON数据（自动解析）
   * @param {string} key - Storage key
   * @param {any} defaultValue - 默认值
   * @returns {any}
   */
  getJSON(key, defaultValue = null) {
    const value = this.get(key, defaultValue);
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return defaultValue;
      }
    }
    return value;
  },

  /**
   * 设置JSON数据（自动序列化）
   * @param {string} key - Storage key
   * @param {any} value - 存储值
   * @returns {boolean}
   */
  setJSON(key, value) {
    return this.set(key, value);
  },

  /**
   * 批量获取数据
   * @param {Array<string>} keys - key数组
   * @returns {Object}
   */
  getBatch(keys) {
    const result = {};
    keys.forEach(key => {
      result[key] = this.get(key);
    });
    return result;
  },

  /**
   * 批量设置数据
   * @param {Object} data - key-value对象
   * @returns {boolean}
   */
  setBatch(data) {
    try {
      Object.entries(data).forEach(([key, value]) => {
        wx.setStorageSync(key, value);
      });
      return true;
    } catch (e) {
      console.warn('[Storage.setBatch] 批量写入失败', e);
      return false;
    }
  }
};

/**
 * 连续打卡算法优化版
 */
const StreakCalculator = {
  /**
   * 计算两个日期之间的天数差
   * @param {Date|string} date1 - 日期1
   * @param {Date|string} date2 - 日期2
   * @returns {number} 天数差（整数）
   */
  getDaysDiff(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    // 只比较日期部分，忽略时间
    const t1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
    const t2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
    return Math.floor((t2 - t1) / (1000 * 60 * 60 * 24));
  },

  /**
   * 获取日期的标准化字符串 (YYYY-MM-DD)
   * @param {Date} date - 日期对象
   * @returns {string}
   */
  formatDate(date = new Date()) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  /**
   * 计算连续打卡天数（优化算法）
   * @param {Array<string>|Object} records - 打卡记录（日期数组或对象）
   * @param {Date|string} referenceDate - 参考日期（默认今天）
   * @returns {Object} { currentStreak, maxStreak, isCheckedToday, lastCheckInDate }
   */
  calculate(records, referenceDate = new Date()) {
    // 统一处理为日期数组
    let dates = [];
    if (Array.isArray(records)) {
      dates = records.filter(d => d).map(d => this.formatDate(d));
    } else if (typeof records === 'object') {
      dates = Object.keys(records).filter(d => records[d]).map(d => this.formatDate(d));
    }

    if (dates.length === 0) {
      return { currentStreak: 0, maxStreak: 0, isCheckedToday: false, lastCheckInDate: null };
    }

    // 去重并排序
    const uniqueDates = [...new Set(dates)].sort();
    const today = this.formatDate(referenceDate);

    // 计算最大连续天数
    let maxStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    for (const date of uniqueDates) {
      if (lastDate) {
        const diff = this.getDaysDiff(lastDate, date);
        if (diff === 1) {
          tempStreak++;
        } else {
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      lastDate = date;
    }
    maxStreak = Math.max(maxStreak, tempStreak);

    // 计算当前连续天数（以参考日期为基准）
    const lastCheckIn = uniqueDates[uniqueDates.length - 1];
    const daysSinceLastCheckIn = this.getDaysDiff(lastCheckIn, today);

    if (daysSinceLastCheckIn === 0) {
      // 今天已打卡
      currentStreak = tempStreak;
    } else if (daysSinceLastCheckIn === 1) {
      // 昨天打卡，今天未打卡但连续还在
      currentStreak = tempStreak;
    } else {
      // 连续已断
      currentStreak = 0;
    }

    return {
      currentStreak,
      maxStreak,
      isCheckedToday: lastCheckIn === today,
      lastCheckInDate: lastCheckIn
    };
  },

  /**
   * 计算带有缓冲期的连续打卡（支持断签缓冲）
   * @param {Array<string>} records - 打卡记录
   * @param {Object} options - 配置项
   * @returns {Object} 包含缓冲期状态的打卡数据
   */
  calculateWithBuffer(records, options = {}) {
    const { bufferDays = 1, gracePeriod = false } = options;
    const baseResult = this.calculate(records);
    
    if (!baseResult.lastCheckInDate) {
      return { ...baseResult, bufferActive: false, daysToRecover: 0 };
    }

    const today = this.formatDate();
    const daysSinceLastCheckIn = this.getDaysDiff(baseResult.lastCheckInDate, today);

    // 缓冲期逻辑
    let bufferActive = false;
    let daysToRecover = 0;

    if (daysSinceLastCheckIn > 1 && daysSinceLastCheckIn <= bufferDays + 1) {
      bufferActive = true;
      daysToRecover = bufferDays + 2 - daysSinceLastCheckIn;
    }

    return {
      ...baseResult,
      bufferActive,
      daysToRecover,
      // 在缓冲期内，currentStreak 保持原值
      effectiveStreak: bufferActive ? baseResult.currentStreak : 
                       (daysSinceLastCheckIn <= 1 ? baseResult.currentStreak : 0)
    };
  },

  /**
   * 检查是否可以打卡
   * @param {string} lastCheckInDate - 最后打卡日期
   * @returns {Object} { canCheckIn, isContinuous, message }
   */
  checkCheckInStatus(lastCheckInDate) {
    if (!lastCheckInDate) {
      return { canCheckIn: true, isContinuous: false, message: '首次打卡' };
    }

    const today = this.formatDate();
    if (lastCheckInDate === today) {
      return { canCheckIn: false, isContinuous: false, message: '今日已打卡' };
    }

    const daysDiff = this.getDaysDiff(lastCheckInDate, today);
    if (daysDiff === 1) {
      return { canCheckIn: true, isContinuous: true, message: '连续打卡' };
    }

    return { canCheckIn: true, isContinuous: false, message: '重新开始' };
  }
};

/**
 * 胶囊（愿望）数据管理
 */
const CapsuleManager = {
  _cacheKey: 'capsules_data',

  /**
   * 获取所有胶囊
   * @param {boolean} useCache - 是否使用缓存
   * @returns {Array}
   */
  getAll(useCache = true) {
    if (useCache) {
      const cached = globalCache.get(this._cacheKey, CACHE_CONFIG.TTL.CAPSULES);
      if (cached !== null) return cached;
    }

    const capsules = Storage.getJSON(STORAGE_KEYS.CAPSULES, []);
    globalCache.set(this._cacheKey, capsules);
    return capsules;
  },

  /**
   * 保存胶囊列表
   * @param {Array} capsules - 胶囊数组
   * @returns {boolean}
   */
  saveAll(capsules) {
    globalCache.set(this._cacheKey, capsules);
    return Storage.setJSON(STORAGE_KEYS.CAPSULES, capsules);
  },

  /**
   * 获取单个胶囊
   * @param {string} id - 胶囊ID
   * @returns {Object|null}
   */
  getById(id) {
    const capsules = this.getAll();
    return capsules.find(c => c.id === id) || null;
  },

  /**
   * 添加胶囊
   * @param {Object} capsule - 胶囊数据
   * @returns {Object} 添加后的胶囊（含ID）
   */
  add(capsule) {
    const capsules = this.getAll(false);
    const newCapsule = {
      ...capsule,
      id: capsule.id || `capsule_${Date.now()}`,
      createdAt: capsule.createdAt || new Date().toISOString(),
      currentPoints: 0,
      completed: false
    };
    capsules.push(newCapsule);
    this.saveAll(capsules);
    return newCapsule;
  },

  /**
   * 更新胶囊
   * @param {string} id - 胶囊ID
   * @param {Object} updates - 更新数据
   * @returns {Object|null}
   */
  update(id, updates) {
    const capsules = this.getAll(false);
    const index = capsules.findIndex(c => c.id === id);
    if (index === -1) return null;

    capsules[index] = { ...capsules[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveAll(capsules);
    return capsules[index];
  },

  /**
   * 删除胶囊
   * @param {string} id - 胶囊ID
   * @returns {boolean}
   */
  remove(id) {
    const capsules = this.getAll(false);
    const filtered = capsules.filter(c => c.id !== id);
    if (filtered.length === capsules.length) return false;
    return this.saveAll(filtered);
  },

  /**
   * 添加打卡记录
   * @param {string} capsuleId - 胶囊ID
   * @param {Object} log - 打卡记录
   * @returns {Object|null}
   */
  addLog(capsuleId, log) {
    const capsules = this.getAll(false);
    const capsule = capsules.find(c => c.id === capsuleId);
    if (!capsule) return null;

    if (!capsule.logs) capsule.logs = [];
    
    const newLog = {
      id: `log_${Date.now()}`,
      date: StreakCalculator.formatDate(),
      points: log.points || 0,
      description: log.description || '',
      createdAt: new Date().toISOString(),
      ...log
    };

    capsule.logs.push(newLog);
    capsule.currentPoints = (capsule.currentPoints || 0) + newLog.points;
    
    this.saveAll(capsules);
    
    // 同时更新打卡记录缓存
    this._invalidateCheckInCache();
    
    return newLog;
  },

  /**
   * 获取打卡记录（按日期聚合）
   * @returns {Object} { 'YYYY-MM-DD': true }
   */
  getCheckInRecords() {
    const cacheKey = 'checkin_records_map';
    const cached = globalCache.get(cacheKey, CACHE_CONFIG.TTL.CHECKIN_RECORDS);
    if (cached !== null) return cached;

    const capsules = this.getAll();
    const records = {};

    capsules.forEach(capsule => {
      if (capsule.logs && Array.isArray(capsule.logs)) {
        capsule.logs.forEach(log => {
          if (log.date) {
            records[log.date] = true;
          }
        });
      }
    });

    globalCache.set(cacheKey, records);
    return records;
  },

  /**
   * 获取某月的打卡数据
   * @param {number} year - 年份
   * @param {number} month - 月份（1-12）
   * @returns {Object} { checkInDays, points, completedGoals, records }
   */
  getMonthData(year, month) {
    const capsules = this.getAll();
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    
    let checkInDays = 0;
    let points = 0;
    let completedGoals = 0;
    const records = {};

    capsules.forEach(capsule => {
      // 统计本月完成的目标
      if (capsule.completed && capsule.completedAt) {
        if (capsule.completedAt.startsWith(monthStr)) {
          completedGoals++;
        }
      }

      // 统计打卡记录
      if (capsule.logs && Array.isArray(capsule.logs)) {
        capsule.logs.forEach(log => {
          if (log.date && log.date.startsWith(monthStr)) {
            checkInDays++;
            points += log.points || 0;
            records[log.date] = true;
          }
        });
      }
    });

    return {
      checkInDays,
      points,
      completedGoals,
      records,
      uniqueDays: Object.keys(records).length
    };
  },

  /**
   * 获取某天的记录详情
   * @param {string} date - 日期 'YYYY-MM-DD'
   * @returns {Array}
   */
  getDayRecords(date) {
    const capsules = this.getAll();
    const records = [];

    capsules.forEach(capsule => {
      if (capsule.logs && Array.isArray(capsule.logs)) {
        capsule.logs.forEach(log => {
          if (log.date === date) {
            records.push({
              id: log.id || Date.now(),
              capsuleId: capsule.id,
              title: capsule.wish || '打卡记录',
              points: log.points || 0,
              description: log.description || '',
              createdAt: log.createdAt
            });
          }
        });
      }
    });

    return records.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  },

  /**
   * 使打卡缓存失效
   */
  _invalidateCheckInCache() {
    globalCache.delete('checkin_records_map');
  }
};

/**
 * 统计数据管理
 */
const StatsManager = {
  _cacheKey: 'stats_data',

  /**
   * 获取总体统计
   * @returns {Object}
   */
  getOverall() {
    const cached = globalCache.get(this._cacheKey, CACHE_CONFIG.TTL.STATS);
    if (cached !== null) return cached;

    const capsules = CapsuleManager.getAll();
    
    const totalGoals = capsules.length;
    const completedGoals = capsules.filter(c => c.completed).length;
    const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
    const totalPoints = capsules.reduce((sum, c) => sum + (c.currentPoints || 0), 0);

    const result = {
      totalGoals,
      completedGoals,
      completionRate,
      totalPoints,
      activeGoals: totalGoals - completedGoals
    };

    globalCache.set(this._cacheKey, result);
    return result;
  },

  /**
   * 获取连续打卡统计
   * @returns {Object}
   */
  getStreakStats() {
    const records = CapsuleManager.getCheckInRecords();
    const streak = StreakCalculator.calculate(records);
    
    // 计算历史最大连续天数
    const allDates = Object.keys(records).sort();
    let maxStreak = streak.maxStreak;

    return {
      currentStreak: streak.currentStreak,
      maxStreak,
      isCheckedToday: streak.isCheckedToday,
      lastCheckInDate: streak.lastCheckInDate
    };
  },

  /**
   * 获取周期统计
   * @param {string} period - 'week' | 'month'
   * @returns {Object}
   */
  getPeriodStats(period = 'week') {
    const now = new Date();
    const capsules = CapsuleManager.getAll();
    
    let startDate, endDate, totalDays;
    
    if (period === 'week') {
      // 本周（周一到周日）
      const dayOfWeek = now.getDay() || 7; // 周日转为7
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek + 1);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      totalDays = 7;
    } else {
      // 本月
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      totalDays = endDate.getDate();
    }

    const startStr = StreakCalculator.formatDate(startDate);
    const endStr = StreakCalculator.formatDate(endDate);

    let checkInDays = 0;
    let completedGoals = 0;
    let points = 0;
    const checkInSet = new Set();

    capsules.forEach(capsule => {
      // 统计周期内完成的目标
      if (capsule.completed && capsule.completedAt) {
        const completedDate = capsule.completedAt.split('T')[0];
        if (completedDate >= startStr && completedDate <= endStr) {
          completedGoals++;
        }
      }

      // 统计打卡
      if (capsule.logs && Array.isArray(capsule.logs)) {
        capsule.logs.forEach(log => {
          if (log.date && log.date >= startStr && log.date <= endStr) {
            checkInSet.add(log.date);
            points += log.points || 0;
          }
        });
      }
    });

    checkInDays = checkInSet.size;

    return {
      checkInDays,
      totalDays,
      checkInRate: totalDays > 0 ? Math.round((checkInDays / totalDays) * 100) : 0,
      completedGoals,
      goalRate: capsules.length > 0 ? Math.round((completedGoals / capsules.length) * 100) : 0,
      points
    };
  },

  /**
   * 使统计缓存失效
   */
  invalidateCache() {
    globalCache.delete(this._cacheKey);
  }
};

/**
 * 全局数据管理（兼容原有 app.globalData）
 */
const GlobalDataManager = {
  /**
   * 获取全局数据
   * @returns {Object}
   */
  get() {
    return {
      totalPoints: parseInt(Storage.get(STORAGE_KEYS.TOTAL_POINTS, 0)),
      completedTasks: parseInt(Storage.get(STORAGE_KEYS.COMPLETED_TASKS, 0)),
      completedWishes: parseInt(Storage.get(STORAGE_KEYS.COMPLETED_WISHES, 0)),
      streak: Storage.getJSON(STORAGE_KEYS.STREAK, { current: 0, lastCheckIn: null, bufferUsed: false })
    };
  },

  /**
   * 保存全局数据
   * @param {Object} data - 数据对象
   * @returns {boolean}
   */
  save(data) {
    const updates = {};
    if (data.totalPoints !== undefined) updates[STORAGE_KEYS.TOTAL_POINTS] = data.totalPoints;
    if (data.completedTasks !== undefined) updates[STORAGE_KEYS.COMPLETED_TASKS] = data.completedTasks;
    if (data.completedWishes !== undefined) updates[STORAGE_KEYS.COMPLETED_WISHES] = data.completedWishes;
    if (data.streak !== undefined) updates[STORAGE_KEYS.STREAK] = data.streak;

    return Storage.setBatch(updates);
  },

  /**
   * 更新积分
   * @param {number} delta - 变化值（可为负）
   * @returns {number} 新积分
   */
  updatePoints(delta) {
    const current = parseInt(Storage.get(STORAGE_KEYS.TOTAL_POINTS, 0));
    const updated = Math.max(0, current + delta);
    Storage.set(STORAGE_KEYS.TOTAL_POINTS, updated);
    return updated;
  },

  /**
   * 更新连续打卡
   * @param {Object} streakData - 打卡数据
   * @returns {boolean}
   */
  updateStreak(streakData) {
    return Storage.set(STORAGE_KEYS.STREAK, streakData);
  },

  /**
   * 执行打卡
   * @returns {Object} { success, streak, message, isMilestone }
   */
  doCheckIn() {
    const streak = Storage.getJSON(STORAGE_KEYS.STREAK, { current: 0, lastCheckIn: null, bufferUsed: false });
    const today = StreakCalculator.formatDate();

    if (streak.lastCheckIn === today) {
      return { success: false, streak, message: '今日已打卡', isMilestone: false };
    }

    const checkInStatus = StreakCalculator.checkCheckInStatus(streak.lastCheckIn);
    
    if (checkInStatus.isContinuous) {
      streak.current++;
      streak.bufferUsed = false;
    } else {
      streak.current = 1;
      streak.bufferUsed = false;
    }

    streak.lastCheckIn = today;
    this.updateStreak(streak);

    // 检查里程碑
    const milestones = [3, 7, 14, 30, 60, 100];
    const isMilestone = milestones.includes(streak.current);

    return {
      success: true,
      streak,
      message: checkInStatus.message,
      isMilestone,
      milestoneDays: isMilestone ? streak.current : null
    };
  },

  /**
   * 获取连续打卡加成
   * @returns {number} 加成百分比
   */
  getStreakBonus() {
    const streak = Storage.getJSON(STORAGE_KEYS.STREAK, { current: 0 });
    const days = streak.current || 0;

    if (days >= 100) return 100;
    if (days >= 60) return 80;
    if (days >= 30) return 50;
    if (days >= 14) return 30;
    if (days >= 7) return 20;
    if (days >= 3) return 10;
    return 0;
  }
};

/**
 * 每日任务管理
 */
const DailyTaskManager = {
  /**
   * 检查并执行每日重置
   * @returns {boolean} 是否执行了重置
   */
  checkDailyReset() {
    const today = new Date().toDateString();
    const lastRefresh = Storage.get(STORAGE_KEYS.LAST_REFRESH);

    if (lastRefresh !== today) {
      // 执行每日重置
      Storage.set(STORAGE_KEYS.REFRESH_COUNT, 3);
      Storage.set(STORAGE_KEYS.LAST_REFRESH, today);
      Storage.remove(STORAGE_KEYS.DAILY_TASKS);
      return true;
    }

    return false;
  },

  /**
   * 获取今日剩余刷新次数
   * @returns {number}
   */
  getRefreshCount() {
    this.checkDailyReset();
    return Storage.get(STORAGE_KEYS.REFRESH_COUNT, 3);
  },

  /**
   * 使用一次刷新
   * @returns {number} 剩余次数
   */
  useRefresh() {
    const count = this.getRefreshCount();
    if (count > 0) {
      Storage.set(STORAGE_KEYS.REFRESH_COUNT, count - 1);
      return count - 1;
    }
    return 0;
  }
};

// 导出模块
module.exports = {
  // 常量
  STORAGE_KEYS,
  CACHE_CONFIG,

  // 核心模块
  Storage,
  DataCache,
  StreakCalculator,
  CapsuleManager,
  StatsManager,
  GlobalDataManager,
  DailyTaskManager,

  // 全局缓存实例（供外部访问）
  globalCache,

  // 便捷方法
  utils: {
    formatDate: StreakCalculator.formatDate.bind(StreakCalculator),
    getDaysDiff: StreakCalculator.getDaysDiff.bind(StreakCalculator),
    clearCache: () => globalCache.clear()
  }
};
