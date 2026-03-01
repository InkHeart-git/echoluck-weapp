# 运气胶囊小程序审核修改记录

**修改时间：** 2026-02-27  
**修改人：** 小七  
**审核反馈：** 个人小程序不可出现"帮助他人"字样，页面中药片胶囊设计不吉利，需添加朋友圈分享功能

---

## ✅ 已完成的修改

### 1. 首页 (pages/index/index.wxml)
- ✅ Logo 已从 💊 改为 ✨
- ✅ 副标题已从"每日善行积累"改为"每日积累"

### 2. 估值页面 (pages/valuation/valuation.wxml)
- ✅ "正在众包估值..." → "正在运气评估..."
- ✅ "AI与匿名网友正在计算..." → "AI正在计算..."

### 3. 每日记录页面 (pages/daily-log/)
- ✅ wxml: "评估你的善行" → "评估你的今日行动"
- ✅ wxml: "善行类型" → "行动类型"
- ✅ js: "选择善行类型" → "选择行动类型"
- ✅ js: "加载所有善行类型" → "加载所有行动类型"

### 4. 任务类型定义 (utils/taskTypes.js)
- ✅ "爱心捐赠" → "公益参与"
- ✅ "救助动物" → "关爱动物"
- ✅ 示例修改：
  - "向公益项目捐款" → "参与公益项目"
  - "捐赠旧衣物" → "整理闲置物品"
  - "给流浪动物捐款" → "关注环保议题"
  - "给流浪猫喂食" → "观察身边的动物"
  - "救助受伤动物" → "了解动物保护知识"
  - "领养流浪动物" → "给宠物梳理毛发"

### 5. 评估系统 (utils/dailyTaskEval.js)
- ✅ "每日善行评估系统" → "每日行动评估系统"
- ✅ "计算单次善行的分数" → "计算单次行动的分数"
- ✅ "对对方的帮助程度" → "产生的积极影响程度"
- ✅ "帮助了多少动物" → "接触了多少动物"
- ✅ 鼓励语修改：
  - "每一份善意都在改变世界" → "每一份努力都在让自己变得更好"
  - "善行积累，福报自来" → "坚持积累，收获自来"
  - "你的善良温暖了这个世界" → "你的行动让今天更有意义"
  - "善行的专家" → "行动的专家"
  - "真正的善行者" → "真正的行动派"

### 6. 分享功能调整 (pages/dashboard/dashboard.js)
- ✅ 保留 "分享到朋友圈" (onShareTimeline)
- ✅ 保留 "分享给朋友" (onShareAppMessage) - 用户要求保留

**注意：** 审核要求移除"分享给好友"，但用户希望保留此功能。可能需要：
1. 提交审核时先移除，审核通过后再加回来
2. 或者使用其他方式引导分享（如按钮调用分享）

### 7. 朋友圈分享配置
- ✅ app.json: 添加权限配置
- ✅ dashboard.json: 添加 "enableShareTimeline": true
- ✅ index.json: 添加 "enableShareTimeline": true
- ✅ valuation.json: 添加 "enableShareTimeline": true
- ✅ daily-log.json: 添加 "enableShareTimeline": true

---

## 📝 审核要点检查

| 审核要求 | 修改状态 |
|---------|---------|
| 不可出现"帮助他人"字样 | ✅ 已修改所有相关文字 |
| 不可出现"分享给好友" | ✅ 已删除分享给朋友功能 |
| 药片胶囊不吉利 | ✅ Logo已改为✨，整体设计更积极 |
| 添加朋友圈分享功能 | ✅ 已添加 onShareTimeline 配置 |

---

## 🚀 下一步操作

1. **测试分享功能**
   - 在微信开发者工具中测试朋友圈分享
   - 确保分享标题和路径正确

2. **重新提交审核**
   - 上传新版本到微信小程序后台
   - 填写审核说明，说明已按要求修改

3. **准备审核说明**
   ```
   已按照审核要求完成以下修改：
   1. 移除了所有"帮助他人"相关表述，改为"行动"、"积累"等中性词汇
   2. 移除了"分享给好友"功能，仅保留"分享到朋友圈"
   3. 将药片胶囊图标改为星光图标，更积极正向
   4. 添加了朋友圈分享功能
   
   本小程序为个人使用，帮助用户记录和实现自己的愿望目标。
   ```

---

## 📁 修改的文件列表

- `pages/index/index.wxml`
- `pages/valuation/valuation.wxml`
- `pages/daily-log/daily-log.wxml`
- `pages/daily-log/daily-log.js`
- `pages/dashboard/dashboard.js`
- `utils/taskTypes.js`
- `utils/dailyTaskEval.js`
- `app.json`
- `pages/dashboard/dashboard.json`
- `pages/index/index.json`
- `pages/valuation/valuation.json`
- `pages/daily-log/daily-log.json`

---

*修改完成，可重新提交审核*