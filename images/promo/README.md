# 宣传物料说明

## 文件清单

### 二维码（太阳码）
- `qrcode-dark.png` - 深色版小程序码（适合浅色背景）
- `qrcode-light.png` - 浅色版小程序码（适合深色背景）

### 海报模板
- `poster-dark.png` - 深色版朋友圈海报
- `poster-light.png` - 浅色版朋友圈海报

### 设计源文件
- `source.ai` - Adobe Illustrator 源文件
- `source-sketch.sketch` - Sketch 源文件
- `design-guide.pdf` - 设计规范文档

## 使用场景

### 1. 海报分享功能
在 `utils/posterGenerator.js` 中生成分享海报时，可添加小程序二维码：

```javascript
// 绘制二维码到海报
const qrCodePath = '/images/promo/qrcode-light.png';
ctx.drawImage(qrCodePath, x, y, width, height);
```

### 2. 关于页面
可在小程序"关于"页面展示小程序码，方便用户分享。

### 3. 线下推广
打印二维码用于线下推广物料。

## 注意事项

1. **二维码有效期**：小程序码永久有效
2. **尺寸建议**：显示尺寸不小于 100x100px
3. **安全区域**：二维码周围保留 10% 的空白区域
4. **颜色对比**：确保二维码与背景有足够的对比度

## 文件位置

```
echoluck-weapp/
└── images/
    └── promo/
        ├── qrcode-dark.png
        ├── qrcode-light.png
        ├── poster-dark.png
        ├── poster-light.png
        ├── source.ai
        ├── source-sketch.sketch
        └── design-guide.pdf
```
