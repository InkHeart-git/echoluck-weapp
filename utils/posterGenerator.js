/**
 * 海报生成工具类
 * 使用微信小程序 Canvas API 生成分享海报
 * 
 * 支持：
 * 1. 离线 Canvas 提升性能
 * 2. 网络图片下载并绘制（如二维码）
 * 3. 文本自动换行
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
   * 下载网络图片到本地
   * @param {string} url - 图片URL
   * @returns {Promise<string>} 本地临时文件路径
   */
  downloadImage(url) {
    return new Promise((resolve, reject) => {
      // 检查是否已缓存
      if (this.preloadedImages.has(url)) {
        resolve(this.preloadedImages.get(url));
        return;
      }

      wx.downloadFile({
        url: url,
        success: (res) => {
          if (res.statusCode === 200) {
            this.preloadedImages.set(url, res.tempFilePath);
            resolve(res.tempFilePath);
          } else {
            reject(new Error(`下载失败，状态码: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          console.error(`[PosterGenerator] 下载图片失败: ${url}`, err);
          // 提示域名配置问题
          if (err.errMsg && err.errMsg.includes('domain')) {
            console.error('[PosterGenerator] 提示: 请在微信公众平台配置 downloadFile 合法域名，或在开发者工具中开启「不校验合法域名」');
          }
          reject(err);
        }
      });
    });
  }

  /**
   * 批量下载图片
   * @param {Array<string>} urls - 图片URL数组
   * @returns {Promise<Object>} 下载结果 { success: [], failed: [] }
   */
  async downloadImages(urls) {
    const results = { success: [], failed: [] };
    
    for (const url of urls) {
      try {
        const path = await this.downloadImage(url);
        results.success.push({ url, path });
      } catch (err) {
        results.failed.push({ url, error: err });
      }
    }
    
    return results;
  }

  /**
   * 创建 Canvas 上下文
   * @param {boolean} forceLegacy - 是否强制使用旧版 Canvas（本地图片时需要）
   */
  createCanvasContext(forceLegacy = false) {
    // 本地图片强制使用旧版 Canvas，因为 Canvas 2D 对本地图片支持有问题
    if (!forceLegacy && wx.createOffscreenCanvas) {
      try {
        const offscreenCanvas = wx.createOffscreenCanvas({
          type: '2d',
          width: this.canvasWidth,
          height: this.canvasHeight
        });
        
        if (offscreenCanvas && offscreenCanvas.getContext) {
          const ctx = offscreenCanvas.getContext('2d');
          if (ctx) {
            return { ctx, canvas: offscreenCanvas, isOffscreen: true };
          }
        }
      } catch (e) {
        console.warn('[PosterGenerator] 离线 Canvas 创建失败', e);
      }
    }

    return {
      ctx: wx.createCanvasContext('posterCanvas'),
      canvas: null,
      isOffscreen: false
    };
  }

  /**
   * 生成打卡海报（带二维码）
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
      userAvatar = null,
      qrCodeUrl = null  // 二维码图片URL
    } = data;

    try {
      // 1. 处理二维码图片（如果有）
      let qrCodeSrc = null;
      let isLocalImage = false;
      if (qrCodeUrl) {
        if (qrCodeUrl.startsWith('/')) {
          // 本地图片：直接使用路径
          qrCodeSrc = qrCodeUrl;
          isLocalImage = true;
          console.log('[PosterGenerator] 使用本地二维码:', qrCodeSrc);
        } else {
          // 网络图片：下载到本地
          try {
            qrCodeSrc = await this.downloadImage(qrCodeUrl);
            console.log('[PosterGenerator] 二维码下载成功:', qrCodeSrc);
          } catch (e) {
            console.error('[PosterGenerator] 二维码下载失败:', e);
          }
        }
      }

      // 2. 创建 Canvas 上下文（本地图片强制使用旧版 Canvas）
      const { ctx, canvas, isOffscreen } = this.createCanvasContext(isLocalImage);

      // 3. 绘制背景
      this.drawBackground(ctx);
      
      // 4. 绘制标题
      this.drawTitle(ctx, '我的打卡成就');
      
      // 5. 绘制用户信息
      await this.drawUserInfo(ctx, userName, userAvatar);
      
      // 6. 绘制统计数据
      this.drawStats(ctx, {
        checkInDays,
        totalPoints,
        completedGoals,
        streakDays
      });
      
      // 7. 绘制激励语
      this.drawQuote(ctx, quote);
      
      // 8. 绘制底部信息和二维码（传递 canvas 用于 Canvas 2D 图片加载）
      await this.drawFooter(ctx, qrCodeSrc, canvas);

      // 9. 生成图片
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
   * 生成海报（简化版，不带二维码）
   */
  async generateSimplePoster(data, callback) {
    // 调用完整版，但不传二维码URL
    await this.generateCheckInPoster(data, callback);
  }

  /**
   * 从离线 Canvas 生成图片
   */
  generateFromOffscreen(canvas, callback) {
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
  }

  /**
   * 从普通 Canvas 生成图片
   */
  generateFromNormalCanvas(ctx, callback) {
    ctx.draw(false, () => {
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
    gradient.addColorStop(0, '#0a0e27');
    gradient.addColorStop(0.5, '#1a1f3d');
    gradient.addColorStop(1, '#0f1429');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // 装饰圆形
    this.drawCircle(ctx, 600, 200, 150, 'rgba(0, 122, 255, 0.08)');
    this.drawCircle(ctx, 100, 800, 100, 'rgba(88, 86, 214, 0.08)');
    this.drawCircle(ctx, 650, 1000, 80, 'rgba(52, 199, 89, 0.05)');
    
    // 绘制星星
    this.drawStars(ctx);
  }

  /**
   * 绘制星星背景
   */
  drawStars(ctx) {
    const stars = [
      { x: 100, y: 150, size: 2, opacity: 0.6 },
      { x: 200, y: 100, size: 3, opacity: 0.8 },
      { x: 500, y: 80, size: 2, opacity: 0.5 },
      { x: 650, y: 200, size: 2, opacity: 0.7 },
      { x: 50, y: 400, size: 2, opacity: 0.4 },
      { x: 700, y: 500, size: 3, opacity: 0.6 },
      { x: 150, y: 600, size: 2, opacity: 0.5 },
      { x: 600, y: 700, size: 2, opacity: 0.7 },
      { x: 80, y: 900, size: 2, opacity: 0.6 },
      { x: 680, y: 950, size: 3, opacity: 0.8 },
    ];
    
    stars.forEach(star => {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  /**
   * 绘制圆形
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
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, this.canvasWidth / 2, 100);
    
    // 下划线
    ctx.beginPath();
    ctx.moveTo(280, 125);
    ctx.lineTo(470, 125);
    ctx.strokeStyle = '#007AFF';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  /**
   * 绘制用户信息
   */
  async drawUserInfo(ctx, userName, avatarUrl) {
    const centerX = this.canvasWidth / 2;
    const y = 180;

    ctx.save();
    ctx.font = '32px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${userName}的打卡记录`, centerX, y);
    ctx.restore();
  }

  /**
   * 绘制统计数据
   */
  drawStats(ctx, stats) {
    const { checkInDays, totalPoints, completedGoals, streakDays } = stats;
    
    const statsData = [
      { label: '连续打卡', value: streakDays, unit: '天', color: '#FF9500' },
      { label: '累计打卡', value: checkInDays, unit: '天', color: '#007AFF' },
      { label: '完成目标', value: completedGoals, unit: '个', color: '#34C759' },
      { label: '获得积分', value: totalPoints, unit: '分', color: '#AF52DE' }
    ];
    
    const startY = 280;
    const cardWidth = 300;
    const cardHeight = 180;
    const gapX = 70;
    const gapY = 40;
    
    statsData.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 75 + col * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);
      
      this.drawStatCard(ctx, x, y, cardWidth, cardHeight, item);
    });
  }

  /**
   * 绘制单个统计卡片
   */
  drawStatCard(ctx, x, y, width, height, item) {
    ctx.save();
    
    // 卡片背景 - 玻璃拟态
    this.drawRoundRect(ctx, x, y, width, height, 20, 'rgba(30, 35, 60, 0.6)');
    
    // 卡片边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(item.label, x + width / 2, y + 125);
    
    ctx.restore();
  }

  /**
   * 绘制激励语
   */
  drawQuote(ctx, quote) {
    const y = 780;
    const maxWidth = 560;
    const lineHeight = 50;
    const maxLines = 3;
    
    ctx.save();
    
    // 自动换行处理
    const lines = this.wrapText(ctx, quote, maxWidth, 36, maxLines);
    
    // 引号
    ctx.font = 'bold 60px serif';
    ctx.fillStyle = '#007AFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('"', 60, y - 10);
    
    // 文字
    ctx.font = 'italic 36px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const totalHeight = lines.length * lineHeight;
    const startY = y - totalHeight / 2 + lineHeight / 2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, this.canvasWidth / 2, startY + index * lineHeight);
    });
    
    // 结束引号
    ctx.font = 'bold 60px serif';
    ctx.fillStyle = '#007AFF';
    ctx.textAlign = 'right';
    ctx.fillText('"', 690, startY + (lines.length - 1) * lineHeight - 10);
    
    ctx.restore();
  }

  /**
   * 绘制底部信息和二维码
   * @param {Object} ctx - Canvas 上下文
   * @param {string} qrCodePath - 二维码本地路径（可选）
   * @param {Object} canvas - Canvas 对象（Canvas 2D 需要）
   * @returns {Promise} 绘制完成的Promise
   */
  async drawFooter(ctx, qrCodePath = null, canvas = null) {
    const y = 1050;
    
    ctx.save();
    
    // 左侧文字信息
    ctx.font = '28px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('我的愿望打卡本', 60, y);
    
    ctx.font = '24px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('扫码使用小程序', 60, y + 35);
    ctx.fillText('一起打卡记录生活', 60, y + 65);
    
    // 右侧二维码区域
    const qrSize = 110;
    const qrX = 580;
    const qrY = y - 35;
    
    // 二维码白色背景
    this.drawRoundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 12, '#ffffff');
    
    if (qrCodePath) {
      try {
        // Canvas 2D 需要先加载图片
        if (canvas && canvas.createImage) {
          const img = canvas.createImage();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = (e) => reject(new Error('图片加载失败: ' + qrCodePath));
            img.src = qrCodePath;
          });
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
          console.log('[PosterGenerator] Canvas 2D 二维码绘制成功');
        } else {
          // 旧版 Canvas 直接用路径（支持本地图片路径如 /images/xxx.jpg）
          ctx.drawImage(qrCodePath, qrX, qrY, qrSize, qrSize);
          console.log('[PosterGenerator] 旧版 Canvas 二维码绘制成功, 路径:', qrCodePath);
        }
      } catch (e) {
        console.error('[PosterGenerator] 绘制二维码图片失败:', e);
        this.drawQRFallback(ctx, qrX, qrY, qrSize);
      }
    } else {
      // 绘制占位符
      this.drawQRFallback(ctx, qrX, qrY, qrSize);
    }
    
    ctx.restore();
  }

  /**
   * 绘制二维码占位符（无二维码时）
   */
  drawQRFallback(ctx, x, y, size) {
    // 浅灰背景
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(x, y, size, size);
    
    // 中间蓝色圆点
    ctx.fillStyle = '#007AFF';
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // 提示文字
    ctx.fillStyle = '#999';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('小程序码', x + size/2, y + size + 20);
  }

  /**
   * 获取图片信息（Promise封装）- 用于加载本地图片
   * @param {string} src - 图片路径
   * @returns {Promise} 图片信息
   */
  getImageInfo(src) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: src,
        success: (res) => resolve(res),
        fail: (err) => reject(err)
      });
    });
  }

  /**
   * 绘制圆角矩形 - 兼容微信小程序（不使用 roundRect）
   */
  drawRoundRect(ctx, x, y, width, height, radius, fillStyle) {
    ctx.save();
    
    // 微信小程序 Canvas 不支持 roundRect，强制使用兼容方案
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
    
    ctx.restore();
  }

  /**
   * 文本自动换行
   */
  wrapText(ctx, text, maxWidth, fontSize = 14, maxLines = null) {
    if (!text || text.length === 0) {
      return [''];
    }

    const chars = text.split('');
    const lines = [];
    let currentLine = '';

    const getCharWidth = (char) => {
      if (/[\u4e00-\u9fa5\uff00-\uffef]/.test(char)) return fontSize;
      if (/[A-Z0-9]/.test(char)) return fontSize * 0.7;
      if (/[a-z]/.test(char)) return fontSize * 0.5;
      if (char === ' ') return fontSize * 0.3;
      return fontSize * 0.6;
    };

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
        
        if (maxLines && lines.length >= maxLines) {
          if (i < chars.length - 1) {
            lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1) + '...';
          }
          break;
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine.length > 0 && (!maxLines || lines.length < maxLines)) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [text];
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.preloadedImages.clear();
  }
}

module.exports = PosterGenerator;
