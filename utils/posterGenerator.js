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
   * 将HEX颜色转换为rgba
   * @param {string} hex - HEX颜色 (#RRGGBB 或 #RRGGBBAA)
   * @param {number} alpha - 透明度 (0-1)，如果hex已包含透明度则优先使用hex的
   * @returns {string} rgba颜色字符串
   */
  hexToRgba(hex, alpha = 1) {
    // 移除 # 前缀
    hex = hex.replace('#', '');
    
    let r, g, b, a = alpha;
    
    if (hex.length === 8) {
      // 8位: RRGGBBAA
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
      a = parseInt(hex.substring(6, 8), 16) / 255;
    } else if (hex.length === 6) {
      // 6位: RRGGBB
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else if (hex.length === 3) {
      // 3位: RGB
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      return hex; // 返回原值
    }
    
    return `rgba(${r}, ${g}, ${b}, ${a})`;
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

      // 4. 绘制主标题
      this.drawMainTitle(ctx, '每一小步，都是向更好的自己迈进');

      // 5. 绘制副标题/能量标语
      this.drawEnergyTag(ctx, streakDays);

      // 6. 绘制能量统计卡片
      this.drawEnergyStats(ctx, {
        checkInDays,
        totalPoints,
        completedGoals,
        streakDays
      });

      // 7. 绘制激励语录
      this.drawInspiringQuote(ctx, quote, streakDays);

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
   * 绘制主标题 - 更有吸引力的文案
   */
  drawMainTitle(ctx, title) {
    ctx.save();

    // 大标题
    ctx.font = 'bold 44px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, this.canvasWidth / 2, 100);

    // 装饰光点
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(180, 100, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(570, 100, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * 绘制能量标签 - 根据连续打卡天数显示不同标语
   */
  drawEnergyTag(ctx, streakDays) {
    ctx.save();

    const centerX = this.canvasWidth / 2;
    const y = 160;

    // 根据连续天数选择标语
    let tagText = '🔥 自律给我自由';
    let tagColor = '#FF9500';

    if (streakDays >= 30) {
      tagText = '👑 自律王者，能量满满';
      tagColor = '#FFD700';
    } else if (streakDays >= 14) {
      tagText = '💪 习惯已成，势不可挡';
      tagColor = '#FF6B9D';
    } else if (streakDays >= 7) {
      tagText = '⭐ 坚持一周，蜕变开始';
      tagColor = '#5856D6';
    } else if (streakDays >= 3) {
      tagText = '🚀 连续打卡，动力十足';
      tagColor = '#34C759';
    }

    // 标签背景
    ctx.font = 'bold 28px sans-serif';
    const textWidth = ctx.measureText(tagText).width;
    const padding = 24;
    const tagWidth = textWidth + padding * 2;
    const tagHeight = 48;

    this.drawRoundRect(
      ctx,
      centerX - tagWidth / 2,
      y - tagHeight / 2,
      tagWidth,
      tagHeight,
      24,
      tagColor + '30' // 20% 透明度背景
    );

    // 标签边框
    ctx.strokeStyle = tagColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 标签文字
    ctx.fillStyle = tagColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagText, centerX, y);

    ctx.restore();
  }

  /**
   * 绘制能量统计卡片 - 突出正能量积累
   */
  drawEnergyStats(ctx, stats) {
    const { checkInDays, totalPoints, completedGoals, streakDays } = stats;

    // 使用更有意义的标签
    const statsData = [
      { label: '✨ 正能量值', value: totalPoints, unit: '分', color: '#FFD700', icon: '⚡' },
      { label: '🔥 连续打卡', value: streakDays, unit: '天', color: '#FF6B9D', icon: '🔥' },
      { label: '✅ 已完成目标', value: completedGoals, unit: '个', color: '#34C759', icon: '✅' },
      { label: '📅 累计打卡', value: checkInDays, unit: '天', color: '#5856D6', icon: '📅' }
    ];

    const startY = 240;
    const cardWidth = 300;
    const cardHeight = 160;
    const gapX = 70;
    const gapY = 30;

    statsData.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 75 + col * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);

      this.drawEnergyCard(ctx, x, y, cardWidth, cardHeight, item);
    });
  }

  /**
   * 绘制单个能量卡片
   */
  drawEnergyCard(ctx, x, y, width, height, item) {
    ctx.save();

    // 卡片背景 - 渐变效果
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, this.hexToRgba(item.color, 0.13)); // 13% 透明度
    gradient.addColorStop(1, this.hexToRgba(item.color, 0.03));

    this.drawRoundRect(ctx, x, y, width, height, 20, gradient);

    // 卡片边框 - 发光效果
    ctx.strokeStyle = this.hexToRgba(item.color, 0.25);
    ctx.lineWidth = 2;
    ctx.stroke();

    // 图标
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(item.icon, x + 20, y + 20);

    // 数值
    ctx.font = 'bold 56px sans-serif';
    ctx.fillStyle = item.color;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(item.value), x + width - 20, y + 60);

    // 单位
    ctx.font = '24px sans-serif';
    ctx.fillText(item.unit, x + width - 20, y + 95);

    // 标签
    ctx.font = '24px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'left';
    ctx.fillText(item.label, x + 20, y + height - 35);

    ctx.restore();
  }

  /**
   * 绘制激励语录 - 更有感染力的文案
   */
  drawInspiringQuote(ctx, quote, streakDays) {
    const y = 680;

    ctx.save();

    // 默认励志语录
    let inspiringText = quote;
    if (!inspiringText || inspiringText === '坚持就是胜利') {
      const quotes = [
        '自律不是束缚，而是通往自由的钥匙',
        '每一滴汗水，都是未来的光芒',
        '你今天流的汗，是明天绽放的花',
        '坚持是最酷的自律，打卡是最美的仪式',
        '积跬步以至千里，积小流以成江海',
        '今天的你，比昨天更强大'
      ];
      inspiringText = quotes[Math.floor(Math.random() * quotes.length)];
    }

    // 引用框背景
    const boxPadding = 30;
    const maxWidth = 600;
    ctx.font = 'italic 32px sans-serif';
    const lines = this.wrapText(ctx, inspiringText, maxWidth - boxPadding * 2, 32, 2);
    const lineHeight = 44;
    const boxHeight = lines.length * lineHeight + boxPadding * 2;

    // 渐变背景框
    const gradient = ctx.createLinearGradient(75, y - boxHeight / 2, 675, y + boxHeight / 2);
    gradient.addColorStop(0, 'rgba(88, 86, 214, 0.15)');
    gradient.addColorStop(0.5, 'rgba(0, 122, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(52, 199, 89, 0.15)');

    this.drawRoundRect(ctx, 75, y - boxHeight / 2, 600, boxHeight, 16, gradient);

    // 左边装饰条
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(75, y - boxHeight / 2, 4, boxHeight);

    // 引号
    ctx.font = 'bold 48px serif';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'left';
    ctx.fillText('"', 95, y - boxHeight / 2 + 35);

    // 文字
    ctx.font = 'italic 30px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.textAlign = 'center';

    const startY = y - (lines.length - 1) * lineHeight / 2;
    lines.forEach((line, index) => {
      ctx.fillText(line, this.canvasWidth / 2, startY + index * lineHeight);
    });

    // 结束引号
    ctx.font = 'bold 48px serif';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'right';
    ctx.fillText('"', 655, startY + (lines.length - 1) * lineHeight - 10);

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
    const y = 980;
    const cardX = 60;
    const cardY = y;
    const cardWidth = 630;
    const cardHeight = 140;
    const cornerRadius = 20;

    ctx.save();

    // 绘制长条卡片背景（圆角矩形）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, cornerRadius, ctx.fillStyle);
    ctx.fill();

    // 绘制卡片边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 左侧文字区域
    const textX = cardX + 30;
    const textY = cardY + cardHeight / 2;

    // 小程序名称
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('我的愿望打卡本', textX, textY - 15);

    // 扫码提示
    ctx.font = '24px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('长按识别 · 开启打卡之旅', textX, textY + 25);

    // 右侧二维码区域（使用原图尺寸，限制最大高度）
    const maxQrHeight = 120;
    const qrX = cardX + cardWidth - 290; // 再向左移动约2cm (75rpx)
    const qrY = cardY + (cardHeight - maxQrHeight) / 2;

    if (qrCodePath) {
      try {
        // 先获取图片信息以确定原始尺寸
        const imgInfo = await this.getImageInfo(qrCodePath);
        const originalWidth = imgInfo.width;
        const originalHeight = imgInfo.height;
        
        // 计算缩放比例，保持原比例，最大高度不超过maxQrHeight
        const scale = Math.min(1, maxQrHeight / originalHeight);
        const qrWidth = originalWidth * scale;
        const qrHeight = originalHeight * scale;
        
        // 垂直居中
        const finalQrY = cardY + (cardHeight - qrHeight) / 2;

        // Canvas 2D 需要先加载图片
        if (canvas && canvas.createImage) {
          const img = canvas.createImage();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = (e) => reject(new Error('图片加载失败: ' + qrCodePath));
            img.src = qrCodePath;
          });
          ctx.drawImage(img, qrX, finalQrY, qrWidth, qrHeight);
          console.log('[PosterGenerator] Canvas 2D 二维码绘制成功，原尺寸:', originalWidth, 'x', originalHeight);
        } else {
          // 旧版 Canvas 直接用路径
          ctx.drawImage(qrCodePath, qrX, finalQrY, qrWidth, qrHeight);
          console.log('[PosterGenerator] 旧版 Canvas 二维码绘制成功，原尺寸:', originalWidth, 'x', originalHeight);
        }
      } catch (e) {
        console.error('[PosterGenerator] 绘制二维码图片失败:', e);
        // 使用默认尺寸绘制占位符
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(qrX, qrY, 120, 120);
      }
    } else {
      // 绘制占位符
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(qrX, qrY, 120, 120);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('QR', qrX + 60, qrY + 60);
    }

    ctx.restore();
  }

  /**
   * 绘制二维码占位符（无二维码时）
   */
  drawQRFallback(ctx, x, y, width, height) {
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // 灰色矩形背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x, y, width, height);

    // 中间蓝色方块
    const boxSize = Math.min(width, height) / 4;
    ctx.fillStyle = '#007AFF';
    ctx.fillRect(centerX - boxSize / 2, centerY - boxSize / 2, boxSize, boxSize);

    // 提示文字
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('小程序码', centerX, centerY + height / 2 + 30);
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
