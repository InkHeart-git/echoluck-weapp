/**
 * 海报生成工具类 - 修复版
 * 使用微信小程序 Canvas API 生成分享海报
 */

class PosterGenerator {
  constructor() {
    this.canvasWidth = 750;
    this.canvasHeight = 1200;
    this.pixelRatio = wx.getSystemInfoSync().pixelRatio || 2;
  }

  /**
   * 下载图片并返回临时路径
   */
  downloadImage(url) {
    return new Promise((resolve, reject) => {
      console.log('[Poster] 开始下载图片:', url);
      
      wx.downloadFile({
        url: url,
        success: (res) => {
          console.log('[Poster] 下载结果:', res.statusCode, res.tempFilePath);
          if (res.statusCode === 200) {
            resolve(res.tempFilePath);
          } else {
            reject(new Error(`下载失败: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          console.error('[Poster] 下载失败:', err);
          reject(err);
        }
      });
    });
  }

  /**
   * 生成打卡海报
   */
  async generateCheckInPoster(data, callback) {
    const { 
      userName = '我', 
      checkInDays = 0, 
      totalPoints = 0, 
      completedGoals = 0,
      streakDays = 0,
      quote = '坚持就是胜利',
      qrCodeUrl = null
    } = data;

    console.log('[Poster] 开始生成海报, qrCodeUrl:', qrCodeUrl);

    try {
      // 1. 先下载二维码图片
      let qrCodePath = null;
      if (qrCodeUrl) {
        try {
          qrCodePath = await this.downloadImage(qrCodeUrl);
          console.log('[Poster] 二维码下载成功:', qrCodePath);
        } catch (e) {
          console.warn('[Poster] 二维码下载失败:', e);
        }
      }

      // 2. 使用普通 Canvas（离线Canvas对图片支持有问题）
      const ctx = wx.createCanvasContext('posterCanvas');
      
      // 3. 绘制背景
      this.drawBackground(ctx);
      
      // 4. 绘制标题
      this.drawTitle(ctx, '我的打卡成就');
      
      // 5. 绘制用户信息
      this.drawUserInfo(ctx, userName);
      
      // 6. 绘制统计数据
      this.drawStats(ctx, { checkInDays, totalPoints, completedGoals, streakDays });
      
      // 7. 绘制激励语
      this.drawQuote(ctx, quote);
      
      // 8. 绘制底部（包括二维码）
      await this.drawFooter(ctx, qrCodePath);

      // 9. 生成图片
      console.log('[Poster] 开始生成临时文件...');
      
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
              console.log('[Poster] 生成成功:', res.tempFilePath);
              callback && callback(null, res.tempFilePath);
            },
            fail: (err) => {
              console.error('[Poster] 生成失败:', err);
              callback && callback(err, null);
            }
          });
        }, 500); // 增加延迟确保绘制完成
      });

    } catch (error) {
      console.error('[Poster] 海报生成失败:', error);
      callback && callback(error, null);
    }
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
    
    // 绘制星星
    this.drawStars(ctx);
  }

  drawStars(ctx) {
    const stars = [
      { x: 100, y: 150, size: 2 },
      { x: 200, y: 100, size: 3 },
      { x: 500, y: 80, size: 2 },
      { x: 650, y: 200, size: 2 },
      { x: 700, y: 500, size: 3 },
    ];
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawCircle(ctx, x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTitle(ctx, title) {
    ctx.font = 'bold 48px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(title, this.canvasWidth / 2, 100);
    
    ctx.beginPath();
    ctx.moveTo(280, 125);
    ctx.lineTo(470, 125);
    ctx.strokeStyle = '#007AFF';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  drawUserInfo(ctx, userName) {
    ctx.font = '32px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText(`${userName}的打卡记录`, this.canvasWidth / 2, 180);
  }

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

  drawStatCard(ctx, x, y, width, height, item) {
    // 卡片背景
    this.drawRoundRect(ctx, x, y, width, height, 20, 'rgba(30, 35, 60, 0.6)');
    
    ctx.font = 'bold 56px sans-serif';
    ctx.fillStyle = item.color;
    ctx.textAlign = 'center';
    ctx.fillText(String(item.value), x + width / 2, y + 70);
    
    ctx.font = '24px sans-serif';
    ctx.fillText(item.unit, x + width / 2 + 50, y + 70);
    
    ctx.font = '28px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(item.label, x + width / 2, y + 125);
  }

  drawQuote(ctx, quote) {
    const y = 780;
    const lines = this.wrapText(quote, 560, 36, 3);
    
    ctx.font = 'bold 60px serif';
    ctx.fillStyle = '#007AFF';
    ctx.textAlign = 'left';
    ctx.fillText('"', 60, y - 10);
    
    ctx.font = 'italic 36px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    
    const lineHeight = 50;
    const startY = y - (lines.length * lineHeight) / 2 + lineHeight / 2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, this.canvasWidth / 2, startY + index * lineHeight);
    });
    
    ctx.font = 'bold 60px serif';
    ctx.fillStyle = '#007AFF';
    ctx.textAlign = 'right';
    ctx.fillText('"', 690, startY + (lines.length - 1) * lineHeight - 10);
  }

  /**
   * 绘制底部和二维码
   */
  async drawFooter(ctx, qrCodePath) {
    const y = 1050;
    
    // 文字
    ctx.font = '28px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'left';
    ctx.fillText('我的愿望打卡本', 60, y);
    
    ctx.font = '24px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('扫码使用小程序', 60, y + 35);
    ctx.fillText('一起打卡记录生活', 60, y + 65);
    
    // 二维码区域
    const qrSize = 110;
    const qrX = 580;
    const qrY = y - 35;
    
    // 白色背景
    this.drawRoundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 12, '#ffffff');
    
    if (qrCodePath) {
      console.log('[Poster] 准备绘制二维码:', qrCodePath);
      try {
        // 使用 drawImage 绘制本地图片路径
        ctx.drawImage(qrCodePath, qrX, qrY, qrSize, qrSize);
        console.log('[Poster] drawImage 调用完成');
      } catch (e) {
        console.error('[Poster] 绘制二维码失败:', e);
        this.drawQRFallback(ctx, qrX, qrY, qrSize);
      }
    } else {
      console.log('[Poster] 无二维码路径，绘制占位符');
      this.drawQRFallback(ctx, qrX, qrY, qrSize);
    }
  }

  drawQRFallback(ctx, x, y, size) {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(x, y, size, size);
    
    ctx.fillStyle = '#007AFF';
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  drawRoundRect(ctx, x, y, width, height, radius, fillStyle) {
    ctx.fillStyle = fillStyle;
    
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
    ctx.fill();
  }

  wrapText(text, maxWidth, fontSize, maxLines) {
    const chars = text.split('');
    const lines = [];
    let currentLine = '';

    const getCharWidth = (char) => {
      if (/[\u4e00-\u9fa5]/.test(char)) return fontSize;
      if (/[A-Z0-9]/.test(char)) return fontSize * 0.7;
      if (/[a-z]/.test(char)) return fontSize * 0.5;
      return fontSize * 0.6;
    };

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const testLine = currentLine + char;
      let testWidth = 0;
      for (let c of testLine) testWidth += getCharWidth(c);

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
}

module.exports = PosterGenerator;
