/**
 * 海报生成工具类
 * 使用微信小程序 Canvas API 生成分享海报
 * 
 * 优化点：
 * 1. 使用离线 Canvas 提升性能
 * 2. 文本自动换行功能
 * 3. 图片预加载机制
 * 4. 微信小程序 Canvas API 兼容处理
 */

class PosterGenerator {
  constructor() {
    this.canvasWidth = 750;
    this.canvasHeight = 1200;
    this.pixelRatio = wx.getSystemInfoSync().pixelRatio || 2;
    this.preloadedImages = new Map();
  }

  /**
   * 预加载图片资源
   * @param {Array<string>} imageUrls - 图片URL数组
   * @returns {Promise} 加载完成的Promise
   */
  async preloadImages(imageUrls) {
    const loadPromises = imageUrls.map(url => {
      return new Promise((resolve, reject) => {
        if (this.preloadedImages.has(url)) {
          resolve(this.preloadedImages.get(url));
          return;
        }

        wx.getImageInfo({
          src: url,
          success: (res) => {
            this.preloadedImages.set(url, res.path);
            resolve(res.path);
          },
          fail: (err) => {
            console.warn(`图片加载失败: ${url}`, err);
            reject(err);
          }
        });
      });
    });

    return Promise.allSettled(loadPromises);
  }

  /**
   * 创建 Canvas 上下文
   * 优先使用离线 Canvas 以提升性能
   * @returns {Object} Canvas 上下文对象
   */
  createCanvasContext() {
    // 微信版本 >= 2.16.1 支持离线 Canvas
    if (wx.createOffscreenCanvas) {
      try {
        const offscreenCanvas = wx.createOffscreenCanvas({
          type: '2d',
          width: this.canvasWidth,
          height: this.canvasHeight
        });
        
        // 检查是否成功创建
        if (offscreenCanvas && offscreenCanvas.getContext) {
          const ctx = offscreenCanvas.getContext('2d');
          if (ctx) {
            console.log('[PosterGenerator] 使用离线 Canvas');
            return {
              ctx,
              canvas: offscreenCanvas,
              isOffscreen: true
            };
          }
        }
      } catch (e) {
        console.warn('[PosterGenerator] 离线 Canvas 创建失败，回退到普通 Canvas', e);
      }
    }

    // 回退到普通 Canvas
    console.log('[PosterGenerator] 使用普通 Canvas');
    return {
      ctx: wx.createCanvasContext('posterCanvas'),
      canvas: null,
      isOffscreen: false
    };
  }

  /**
   * 生成打卡海报
   * @param {Object} data - 海报数据
   * @param {Function} callback - 生成完成回调
   */
  async generateCheckInPoster(data, callback) {
    const { 
      userName = '我', 
      checkInDays = 0, 
      totalPoints = 0, 
      completedGoals = 0,
      streakDays = 0,
      quote = '坚持就是胜利',
      userAvatar = null
    } = data;

    try {
      // 创建 Canvas 上下文
      const { ctx, canvas, isOffscreen } = this.createCanvasContext();

      // 1. 绘制背景
      this.drawBackground(ctx);
      
      // 2. 绘制标题
      this.drawTitle(ctx, '我的打卡成就');
      
      // 3. 绘制用户信息
      await this.drawUserInfo(ctx, userName, userAvatar);
      
      // 4. 绘制统计数据
      this.drawStats(ctx, {
        checkInDays,
        totalPoints,
        completedGoals,
        streakDays
      });
      
      // 5. 绘制激励语
      this.drawQuote(ctx, quote);
      
      // 6. 绘制底部信息
      this.drawFooter(ctx);

      // 7. 生成图片
      if (isOffscreen) {
        await this.generateFromOffscreen(canvas, callback);
      } else {
        this.generateFromNormalCanvas(ctx, callback);
      }

    } catch (error) {
      console.error('[PosterGenerator] 海报生成失败:', error);
      callback && callback(error, null);
    }
  }

  /**
   * 从离线 Canvas 生成图片
   */
  generateFromOffscreen(canvas, callback) {
    try {
      // 微信小程序离线 Canvas 需要转换为临时文件
      wx.canvasToTempFilePath({
        canvas,
        width: this.canvasWidth,
        height: this.canvasHeight,
        destWidth: this.canvasWidth * this.pixelRatio,
        destHeight: this.canvasHeight * this.pixelRatio,
        fileType: 'png',
        quality: 1,
        success: (res) => {
          callback && callback(null, res.tempFilePath);
        },
        fail: (err) => {
          callback && callback(err, null);
        }
      });
    } catch (error) {
      callback && callback(error, null);
    }
  }

  /**
   * 从普通 Canvas 生成图片
   */
  generateFromNormalCanvas(ctx, callback) {
    ctx.draw(false, () => {
      // 延迟执行确保绘制完成
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvasId: 'posterCanvas',
          x: 0,
          y: 0,
          width: this.canvasWidth,
          height: this.canvasHeight,
          destWidth: this.canvasWidth * this.pixelRatio,
          destHeight: this.canvasHeight * this.pixelRatio,
          fileType: 'png',
          quality: 1,
          success: (res) => {
            callback && callback(null, res.tempFilePath);
          },
          fail: (err) => {
            callback && callback(err, null);
          }
        });
      }, 300);
    });
  }

  /**
   * 绘制背景
   */
  drawBackground(ctx) {
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    gradient.addColorStop(0, '#1e293b');
    gradient.addColorStop(1, '#0f172a');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // 装饰圆形
    this.drawCircle(ctx, 600, 200, 150, 'rgba(99, 102, 241, 0.1)');
    this.drawCircle(ctx, 100, 800, 100, 'rgba(139, 92, 246, 0.1)');
    this.drawCircle(ctx, 650, 1000, 80, 'rgba(16, 185, 129, 0.05)');
  }

  /**
   * 绘制圆形（兼容处理）
   */
  drawCircle(ctx, x, y, radius, color) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  /**
   * 绘制标题
   */
  drawTitle(ctx, title) {
    ctx.save();
    ctx.font = 'bold 48px sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, this.canvasWidth / 2, 120);
    
    // 下划线
    ctx.beginPath();
    ctx.moveTo(250, 145);
    ctx.lineTo(500, 145);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  /**
   * 绘制用户信息
   * @param {Object} ctx - Canvas 上下文
   * @param {string} userName - 用户名
   * @param {string} avatarUrl - 头像URL
   */
  async drawUserInfo(ctx, userName, avatarUrl) {
    const centerX = this.canvasWidth / 2;
    const y = 200;

    ctx.save();
    ctx.font = '32px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 如果有头像，先绘制头像
    if (avatarUrl) {
      try {
        // 绘制头像圆形背景
        const avatarSize = 60;
        const avatarX = centerX - avatarSize / 2;
        const avatarY = y - 40;

        // 头像圆形裁剪区域
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.clip();

        // 检查是否已预加载
        const imgPath = this.preloadedImages.get(avatarUrl) || avatarUrl;
        
        // 使用 fillRect 作为占位（因为 Canvas 2D API 的 drawImage 在微信小程序中需要特殊处理）
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();

        // 绘制用户名（带偏移）
        ctx.fillText(`${userName}的打卡记录`, centerX, y + 50);
      } catch (e) {
        console.warn('头像绘制失败:', e);
        ctx.fillText(`${userName}的打卡记录`, centerX, y);
      }
    } else {
      ctx.fillText(`${userName}的打卡记录`, centerX, y);
    }
    
    ctx.restore();
  }

  /**
   * 绘制统计数据
   */
  drawStats(ctx, stats) {
    const { checkInDays, totalPoints, completedGoals, streakDays } = stats;
    
    const statsData = [
      { label: '连续打卡', value: streakDays, unit: '天', color: '#f59e0b' },
      { label: '累计打卡', value: checkInDays, unit: '天', color: '#6366f1' },
      { label: '完成目标', value: completedGoals, unit: '个', color: '#10b981' },
      { label: '获得积分', value: totalPoints, unit: '分', color: '#8b5cf6' }
    ];
    
    const startY = 300;
    const cardWidth = 300;
    const cardHeight = 180;
    const gap = 50;
    
    statsData.forEach((item, index) => {
      const x = index % 2 === 0 ? 75 : 375;
      const y = startY + Math.floor(index / 2) * (cardHeight + gap);
      
      // 绘制统计卡片
      this.drawStatCard(ctx, x, y, cardWidth, cardHeight, item);
    });
  }

  /**
   * 绘制单个统计卡片
   */
  drawStatCard(ctx, x, y, width, height, item) {
    ctx.save();
    
    // 卡片背景 - 使用兼容的圆角矩形绘制
    this.drawRoundRect(ctx, x, y, width, height, 20, 'rgba(30, 41, 59, 0.8)');
    
    // 数值
    ctx.font = 'bold 56px sans-serif';
    ctx.fillStyle = item.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(item.value), x + width / 2, y + 70);
    
    // 单位
    ctx.font = '24px sans-serif';
    ctx.fillText(item.unit, x + width / 2 + 50, y + 70);
    
    // 标签
    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(item.label, x + width / 2, y + 125);
    
    ctx.restore();
  }

  /**
   * 绘制圆角矩形（兼容处理）
   * 微信小程序 Canvas 2D API 在低版本可能不支持 roundRect
   */
  drawRoundRect(ctx, x, y, width, height, radius, fillStyle) {
    ctx.save();
    
    // 如果支持原生 roundRect，使用原生方法
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fillStyle = fillStyle;
      ctx.fill();
    } else {
      // 兼容低版本：手动绘制圆角矩形
      const r = Math.min(radius, width / 2, height / 2);
      
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + width - r, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + r);
      ctx.lineTo(x + width, y + height - r);
      ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
      ctx.lineTo(x + r, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    
    ctx.restore();
  }

  /**
   * 绘制激励语
   * 包含自动换行功能
   */
  drawQuote(ctx, quote) {
    const y = 850;
    const maxWidth = 560;
    const lineHeight = 50;
    const maxLines = 3;
    
    ctx.save();
    
    // 自动换行处理
    const lines = this.wrapText(ctx, quote, maxWidth, 36, maxLines);
    
    // 引号
    ctx.font = 'bold 60px serif';
    ctx.fillStyle = '#6366f1';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('"', 80, y - 10);
    
    // 文字
    ctx.font = 'italic 36px sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const totalHeight = lines.length * lineHeight;
    const startY = y - totalHeight / 2 + lineHeight / 2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, this.canvasWidth / 2, startY + index * lineHeight);
    });
    
    // 结束引号
    ctx.font = 'bold 60px serif';
    ctx.fillStyle = '#6366f1';
    ctx.textAlign = 'right';
    ctx.fillText('"', 670, startY + (lines.length - 1) * lineHeight - 10);
    
    ctx.restore();
  }

  /**
   * 文本自动换行
   * @param {Object} ctx - Canvas 上下文
   * @param {string} text - 要换行的文本
   * @param {number} maxWidth - 最大宽度
   * @param {number} fontSize - 字体大小（用于中文字符宽度估算）
   * @param {number} maxLines - 最大行数
   * @returns {Array<string>} 换行后的文本数组
   */
  wrapText(ctx, text, maxWidth, fontSize = 14, maxLines = null) {
    if (!text || text.length === 0) {
      return [''];
    }

    const chars = text.split('');
    const lines = [];
    let currentLine = '';

    // 估算中文字符宽度（考虑到英文字符较窄）
    const getCharWidth = (char) => {
      // 中文字符和全角字符
      if (/[\u4e00-\u9fa5\uff00-\uffef]/.test(char)) {
        return fontSize;
      }
      // 大写字母和数字
      if (/[A-Z0-9]/.test(char)) {
        return fontSize * 0.7;
      }
      // 小写字母
      if (/[a-z]/.test(char)) {
        return fontSize * 0.5;
      }
      // 空格
      if (char === ' ') {
        return fontSize * 0.3;
      }
      // 其他字符
      return fontSize * 0.6;
    };

    // 计算字符串宽度（混合中英文）
    const calcWidth = (str) => {
      let width = 0;
      for (const char of str) {
        width += getCharWidth(char);
      }
      return width;
    };

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const testLine = currentLine + char;
      const testWidth = calcWidth(testLine);

      if (testWidth > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
        
        // 检查是否达到最大行数
        if (maxLines && lines.length >= maxLines) {
          // 如果还有剩余字符，添加省略号
          if (i < chars.length - 1) {
            lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1) + '...';
          }
          break;
        }
      } else {
        currentLine = testLine;
      }
    }

    // 添加最后一行
    if (currentLine.length > 0 && (!maxLines || lines.length < maxLines)) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [text];
  }

  /**
   * 绘制底部信息
   */
  drawFooter(ctx) {
    const y = 1100;
    
    ctx.save();
    
    // 小程序名称
    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('我的愿望打卡本', this.canvasWidth / 2, y);
    
    // 提示
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('扫码使用小程序，一起打卡记录生活', this.canvasWidth / 2, y + 40);
    
    ctx.restore();
  }

  /**
   * 清除预加载的图片缓存
   */
  clearPreloadedImages() {
    this.preloadedImages.clear();
  }

  /**
   * 获取支持的 Canvas 类型
   * @returns {string} 'offscreen' | 'normal' | 'unknown'
   */
  getSupportedCanvasType() {
    if (wx.createOffscreenCanvas) {
      return 'offscreen';
    }
    if (wx.createCanvasContext) {
      return 'normal';
    }
    return 'unknown';
  }
}

module.exports = PosterGenerator;
