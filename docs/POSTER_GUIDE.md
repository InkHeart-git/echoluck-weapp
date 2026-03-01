# 海报分享功能使用说明

## 功能概述

小程序支持生成分享海报，包含：
- 用户打卡数据（连续天数、累计打卡、完成目标、获得积分）
- 激励语录
- 小程序二维码（扫码进入小程序）

## 二维码配置

由于小程序码图片较大（6MB+），需要配置网络图片URL。

### 方案1：腾讯云 COS（推荐）

1. **开通 COS 服务**
   - 访问 https://console.cloud.tencent.com/cos
   - 创建存储桶（选择**公有读私有写**）

2. **上传二维码**
   - 将 `qrcode-light.png` 和 `qrcode-dark.png` 上传到存储桶
   - 获取访问URL：
     ```
     https://your-bucket.cos.ap-guangzhou.myqcloud.com/qrcode-light.png
     https://your-bucket.cos.ap-guangzhou.myqcloud.com/qrcode-dark.png
     ```

3. **配置小程序**
   - 在 `app.js` 或配置文件中加入：
     ```javascript
     globalData: {
       posterConfig: {
         qrCodeUrl: 'https://your-bucket.cos.ap-guangzhou.myqcloud.com/qrcode-light.png'
       }
     }
     ```

4. **修改调用代码**
   - 在生成海报的页面中：
     ```javascript
     const app = getApp();
     const posterGen = new PosterGenerator();
     
     posterGen.generateCheckInPoster({
       userName: '用户名',
       streakDays: 7,
       checkInDays: 30,
       completedGoals: 5,
       totalPoints: 1200,
       quote: '坚持就是胜利',
       qrCodeUrl: app.globalData.posterConfig.qrCodeUrl  // 传入二维码URL
     }, (err, tempFilePath) => {
       if (err) {
         console.error('生成失败:', err);
         return;
       }
       // 保存或分享图片
       wx.saveImageToPhotosAlbum({
         filePath: tempFilePath,
         success: () => {
           wx.showToast({ title: '保存成功' });
         }
       });
     });
     ```

### 方案2：阿里云 OSS

类似腾讯云 COS，上传后获取URL配置即可。

### 方案3：微信小程序云开发

如果使用微信云开发：

1. 上传图片到云存储
2. 获取临时访问链接：
   ```javascript
   wx.cloud.getTempFileURL({
     fileList: ['cloud://your-env/qr-code.png'],
     success: res => {
       const url = res.fileList[0].tempFileURL;
       // 使用 url 生成海报
     }
   });
   ```

## 测试方式

### 开发测试（无网络二维码）

不传入 `qrCodeUrl` 时，会显示占位符：

```javascript
posterGen.generateCheckInPoster({
  // ... 其他参数
  // qrCodeUrl 不传
}, callback);
```

效果：显示蓝色圆点占位符 + "小程序码" 文字

### 真机测试

1. 将二维码上传到任意可访问的图床
2. 获取直链URL
3. 配置到小程序中测试

## 注意事项

1. **域名白名单**
   - 在小程序后台配置 downloadFile 合法域名
   - 路径：开发管理 → 开发设置 → 服务器域名 → downloadFile 合法域名

2. **图片格式**
   - 支持 PNG、JPG、JPEG
   - 建议尺寸：300x300px 以上，保证清晰度

3. **网络权限**
   - 确保用户允许下载网络图片
   - 可在代码中添加权限检查

4. **缓存策略**
   - `PosterGenerator` 会缓存下载的图片
   - 如需刷新，调用 `posterGen.clearCache()`

## API 参考

### PosterGenerator 类

#### 构造函数
```javascript
const posterGen = new PosterGenerator();
```

#### generateCheckInPoster(data, callback)
生成打卡海报

**参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| data.userName | string | 否 | 用户名，默认'我' |
| data.streakDays | number | 否 | 连续打卡天数 |
| data.checkInDays | number | 否 | 累计打卡天数 |
| data.completedGoals | number | 否 | 完成目标数 |
| data.totalPoints | number | 否 | 获得积分 |
| data.quote | string | 否 | 激励语录 |
| data.qrCodeUrl | string | 否 | 二维码图片URL |
| callback | function | 是 | 回调函数 (err, tempFilePath) => {} |

#### downloadImage(url)
下载网络图片

```javascript
const localPath = await posterGen.downloadImage('https://example.com/qr.png');
```

#### clearCache()
清除图片缓存

```javascript
posterGen.clearCache();
```

## 示例代码

完整使用示例：

```javascript
// pages/dashboard/dashboard.js
const PosterGenerator = require('../../utils/posterGenerator.js');

Page({
  data: {
    // ...
  },
  
  onSharePoster() {
    const posterGen = new PosterGenerator();
    const app = getApp();
    
    wx.showLoading({ title: '生成中...' });
    
    posterGen.generateCheckInPoster({
      userName: app.globalData.userInfo?.nickName || '我',
      streakDays: this.data.streak.current,
      checkInDays: this.data.completedTasks,
      completedGoals: this.data.completedWishes,
      totalPoints: this.data.totalPoints,
      quote: this.getRandomQuote(),
      qrCodeUrl: app.globalData.posterConfig?.qrCodeUrl
    }, (err, tempFilePath) => {
      wx.hideLoading();
      
      if (err) {
        wx.showToast({ title: '生成失败', icon: 'none' });
        return;
      }
      
      // 预览或保存
      wx.previewImage({
        urls: [tempFilePath],
        current: tempFilePath
      });
    });
  },
  
  getRandomQuote() {
    const quotes = [
      '坚持就是胜利',
      '每一天都是新的开始',
      '积少成多，聚沙成塔',
      '越努力，越幸运'
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
});
```

## 故障排查

### 二维码不显示
- 检查 `qrCodeUrl` 是否正确
- 检查是否在小程序后台配置了 downloadFile 域名
- 检查网络连接

### 生成失败
- 检查 Canvas 尺寸是否过大
- 检查是否有足够存储空间

### 图片模糊
- 确保原始二维码图片分辨率足够（建议 600x600px）
- 检查 `pixelRatio` 是否正确获取
