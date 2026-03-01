# 宣传物料说明

## ⚠️ 重要提示

由于小程序包体积限制（2MB），宣传物料大文件已移至项目外：

**原文件位置**: `assets/promo-large/`
- 包含：高清海报、高清二维码、设计源文件

**小程序内仅保留**: `images/promo/README.md`

## 使用方案

### 方案1：云存储（推荐）
将大文件上传到腾讯云 COS/阿里云 OSS，使用网络图片链接：

```javascript
// 海报分享时加载网络图片
wx.getImageInfo({
  src: 'https://your-cdn.com/promo/qrcode-light.png',
  success: (res) => {
    // 使用 res.path 绘制到 canvas
  }
});
```

### 方案2：本地真机调试（开发测试）
在电脑上进行真机调试时，可通过微信开发者工具预览：
```
项目设置 → 本地设置 → 不校验合法域名
```

### 方案3：上传时排除（当前配置）
`project.config.json` 已配置排除 `images/promo` 目录：
```json
{
  "packOptions": {
    "ignore": [{"value": "images/promo", "type": "folder"}]
  }
}
```

## 文件清单（在项目根目录 assets/promo-large/）

| 文件 | 说明 | 大小 |
|------|------|------|
| `qrcode-dark.png` | 深色版小程序码 | 6.8MB |
| `qrcode-light.png` | 浅色版小程序码 | 6.8MB |
| `poster-dark.png` | 深色版朋友圈海报 | 4.1MB |
| `poster-light.png` | 浅色版朋友圈海报 | 4.1MB |
| `source.ai` | Adobe Illustrator 源文件 | 862KB |
| `source-sketch.sketch` | Sketch 源文件 | 428KB |
| `design-guide.pdf` | 设计规范文档 | 1.3MB |

## 上传到云存储

### 腾讯云 COS
1. 登录 https://console.cloud.tencent.com/cos
2. 创建存储桶（选择公有读私有写）
3. 上传文件
4. 获取 URL：`https://your-bucket.cos.your-region.myqcloud.com/promo/qrcode-light.png`

### 代码中使用

在 `utils/posterGenerator.js` 中：
```javascript
// 绘制二维码
const qrCodeUrl = 'https://your-cdn.com/promo/qrcode-light.png';
wx.downloadFile({
  url: qrCodeUrl,
  success: (res) => {
    ctx.drawImage(res.tempFilePath, qrX, qrY, qrSize, qrSize);
  }
});
```

