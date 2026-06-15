# 项目系统设计说明书（面向 AI 编程）

**项目名称**：日常履历沉淀与智能简历生成器  
**基于需求版本**：V2.1  
**文档版本**：1.1（含样式/UI设计规范）  
**日期**：2026年6月11日  
**目标**：为 AI 编程提供完整、可执行的系统设计，涵盖后端、前端、数据库、API、关键流程及前端视觉样式规范。

---

## 1. 总体架构

采用前后端分离架构：

- **前端**：React 18 + Ant Design 5，负责 UI 交互、拖拽编辑器、数据展示。
- **后端**：Spring Boot 2.7+，提供 RESTful API，集成 HanLP 分词、poi‑tl 文档生成。
- **数据库**：MongoDB，存储用户、日常记录、布局、模板。
- **文件存储**：本地文件系统（开发）或阿里云 OSS（生产），存储用户上传的图片、附件。

```
[浏览器] <---> [React 前端] <---> [Spring Boot API] <---> [MongoDB]
                              |
                              +---> [HanLP] (分词)
                              +---> [poi‑tl] (生成 .docx)
```

---

## 2. 模块划分与职责

| 模块名                  | 职责                                                                 | 关键技术                           |
| ----------------------- | -------------------------------------------------------------------- | ---------------------------------- |
| **用户认证模块**        | 注册、登录、JWT 令牌管理、用户信息查询                               | Spring Security + JWT              |
| **日常记录管理模块**    | 记录的 CRUD、筛选、排序、软删除、导入/导出、技能标签管理             | MongoDB Repository, 批量操作       |
| **智能分析模块**        | 获取用户所有记录 → 提取 description 纯文本 → HanLP 分词 → 词频统计   | HanLP (自定义词典)                 |
| **低代码编辑器模块**    | 拖拽布局、组件配置、数据绑定、实时预览、布局 JSON 的保存与加载       | react-grid-layout, react-dnd, JSON |
| **模板市场模块**        | 模板列表查询、详情、选用、用户上传/分享模板                          | MongoDB 存储模板元数据 + 布局 JSON |
| **简历导出模块**        | 根据布局 JSON + 用户数据 → 匹配 Word 模板 → poi‑tl 渲染 → 返回 .docx | poi‑tl, 预置 .docx 模板文件        |
| **文件存储模块**        | 用户头像、证书图片、附件上传与 URL 生成                              | MultipartFile, OSS SDK（可选）     |

---

## 3. 数据库设计（MongoDB）

### 3.1 集合结构

#### ① `users`（用户）

```json
{
  "_id": ObjectId,
  "email": "string (unique)",
  "password": "bcrypt hash",
  "name": "string",
  "avatarUrl": "string",
  "createdAt": Date,
  "updatedAt": Date
}
```

#### ② `daily_records`（日常记录）

对应需求 4.1.1 数据模型，字段完全一致。示例：

```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "title": "string",
  "type": "project|internship|competition|skill|certification|other",
  "startDate": ISODate | null,
  "endDate": ISODate | null,
  "description": "string (富文本存储 HTML 或 Markdown)",
  "achievements": ["string"],
  "skills": ["string"],
  "attachments": [{ "url": "string", "name": "string", "type": "image/pdf" }],
  "link": "string",
  "isPublic": false,
  "isHidden": false,
  "deleted": false,
  "deletedAt": Date | null,
  "createdAt": Date,
  "updatedAt": Date
}
```

#### ③ `resume_layouts`（用户保存的编辑器布局）

```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "name": "string (布局名称)",
  "layoutData": {
    "canvasWidth": 800,
    "canvasHeight": 1123,
    "components": [
      {
        "id": "comp-1",
        "type": "textbox",
        "x": 20, "y": 30, "w": 2, "h": 1,
        "props": { "text": "{{name}}", "fontSize": 16, "bold": true },
        "binding": "user.name"
      }
    ]
  },
  "templateId": ObjectId | null,
  "isPublicTemplate": false,
  "createdAt": Date,
  "updatedAt": Date
}
```

#### ④ `templates`（模板市场）

```json
{
  "_id": ObjectId,
  "name": "简约科技蓝",
  "thumbnailUrl": "string",
  "wordTemplateKey": "tech_blue.docx",
  "layoutData": { ... },
  "tags": ["互联网", "简约"],
  "usageCount": 0
}
```

### 3.2 索引建议

- `daily_records`：`{ userId: 1, type: 1, startDate: -1 }`
- `resume_layouts`：`{ userId: 1, updatedAt: -1 }`
- `templates`：`{ tags: 1, usageCount: -1 }`

---

## 4. API 接口设计（RESTful）

基础路径：`/api/v1`，认证方式：`Authorization: Bearer <JWT>`

### 4.1 用户认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/register` | 注册 |
| POST | `/auth/login` | 登录 → 返回 token |
| GET | `/auth/me` | 当前用户 |

### 4.2 日常记录

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/records` | 分页查询，支持 type, keyword, skills 筛选 |
| POST | `/records` | 新增记录 |
| PUT | `/records/{id}` | 更新 |
| DELETE | `/records/{id}` | 软删除 |
| GET | `/records/export` | 导出 CSV/JSON |
| POST | `/records/import` | 批量导入 |

### 4.3 智能分析

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/analysis/skills` | 返回词频统计 `{ word: count }` |

### 4.4 布局与编辑器

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/layouts` | 用户布局列表 |
| POST | `/layouts` | 保存布局 |
| GET | `/layouts/{id}` | 获取完整布局 JSON |

### 4.5 模板市场

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/templates` | 模板列表（标签筛选） |
| GET | `/templates/{id}` | 模板详情 |
| POST | `/templates/{id}/use` | 选用模板复制到我的布局 |

### 4.6 简历导出

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/export/resume` | body: `{ layoutId }` 返回 .docx 二进制流 |

---

## 5. 前端页面与组件结构

### 5.1 页面路由

| 路径 | 组件 | 说明 |
|------|------|------|
| `/login` | LoginPage | 登录 |
| `/dashboard` | DashboardPage | 主控台 + 技能云 |
| `/records` | RecordsPage | 记录管理 |
| `/editor` | EditorPage | 拖拽编辑器 |
| `/templates` | TemplatesPage | 模板市场 |
| `/my-layouts` | MyLayoutsPage | 我的布局 |

### 5.2 核心组件

- `SkillCloud`：echarts-wordcloud 渲染
- `RecordFormModal`：记录表单（react-quill）
- `DragCanvas`：基于 react-grid-layout
- `ComponentLibrary` & `PropertyPanel`

---

## 6. 关键业务逻辑设计

### 6.1 技能词频统计流程

1. 查询用户所有未删除记录。
2. 提取 description 纯文本。
3. HanLP 分词 + 自定义词典 + 停用词过滤。
4. 统计词频并返回。

> 自定义词典路径：`src/main/resources/hanlp/custom_dict.txt`

### 6.2 简历导出流程

1. 根据 layoutId 获取布局 JSON。
2. 解析 binding 字段（如 `records[type=project]`）从数据库获取数据。
3. 组装数据 Map，加载 .docx 模板，调用 poi‑tl 渲染。
4. 返回文件流。

### 6.3 拖拽布局持久化

- 前端通过 `react-grid-layout` 维护布局 state。
- 保存时将 components 数组发送至后端。
- 加载时反序列化为 grid 布局。

---

## 7. 开发环境与配置

### 7.1 后端 application.yml

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/resume_builder
  servlet:
    multipart:
      max-file-size: 10MB
jwt:
  secret: your_jwt_secret_key
hanlp:
  custom-dict: classpath:hanlp/custom_dict.txt
```

### 7.2 前端依赖

- antd, axios, react-grid-layout, react-dnd, react-quill, echarts, echarts-wordcloud

---

## 8. AI 编程的具体建议

### 优先实现顺序（MVP）
1. 用户认证
2. 日常记录 CRUD（纯文本描述）
3. 技能词频统计（HanLP）
4. 基础导出（固定 Word 模板）
5. 拖拽编辑器雏形（保存/加载 JSON）
6. 模板市场简单版
7. 完整数据绑定导出

### AI 生成提示
- 后端实体类使用 `@Document`，Repository 继承 `MongoRepository`
- Service 层抛出统一异常，Controller 使用 `@RestController`
- 前端封装 `request.js` 拦截器，统一处理 token

---

## 9. 扩展建议

- 使用 SpringDoc 生成 API 文档
- 前端状态管理：Zustand 或 Redux Toolkit
- 分词结果缓存到 `user_stats` 集合（TTL 索引）
- Word 模板可动态上传并关联模板 ID

---

## 10. 交付物说明

AI 可生成以下典型文件：

**后端**：User, DailyRecord, ResumeLayout, Template 实体；Repository；AuthController, RecordController, AnalysisController, LayoutController, ExportController；JwtFilter, HanlpService, WordExportService

**前端**：路由配置，api 层，RecordsPage, EditorPage, DragCanvas, SkillCloud 组件

**配置**：application.yml, custom_dict.txt, stopwords.txt

---

## 11. 前端样式与视觉设计规范

### 11.1 设计原则
- 清晰高效，减少干扰
- 现代轻量（柔和阴影，圆角）
- 响应式（≥1200px 完整布局）

### 11.2 色彩系统（Ant Design 主题）

| 用途 | 颜色值 |
|------|--------|
| 主色 | `#1890ff` → 悬停 `#40a9ff` |
| 成功 | `#52c41a` |
| 警告 | `#faad14` |
| 错误 | `#f5222d` |
| 背景 | `#f0f2f5`（全局），`#ffffff`（卡片） |
| 文字 | 主 `#262626`，次 `#595959`，辅助 `#8c8c8c` |
| 边框 | `#d9d9d9`，焦点 `#40a9ff` |

主题配置：
```js
const theme = { token: { colorPrimary: '#1890ff', borderRadius: 8 } };
```

### 11.3 布局尺寸
- 全局最大宽度 1400px，左右边距 24px
- 侧边栏宽度 240px/80px
- 卡片内边距 20px，阴影 `0 2px 8px rgba(0,0,0,0.06)`

### 11.4 字体
- 默认系统字体栈
- 标题 28px/24px/20px，正文 14px，辅助 12px

### 11.5 组件定制
- 按钮：主按钮渐变背景，次要按钮白底灰边
- 输入框：圆角 8px，聚焦蓝色发光阴影
- 模态框：圆角 20px
- 表格：行高 48px，斑马纹

### 11.6 页面特殊样式
- **登录页**：居中卡片宽 420px，深色阴影，渐变背景
- **记录管理**：工具栏 flex 布局，卡片式记录列表
- **编辑器**：三栏布局（组件库260px + 画布 + 属性面板300px），画布白底阴影
- **模板市场**：网格布局，卡片悬停显示浮层按钮

### 11.7 暗色模式（预留）
- 不强制实现，推荐使用 Ant Design 暗色算法

### 11.8 图标规范
- 统一使用 `@ant-design/icons`
- 常用：PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, DragOutlined

### 11.9 响应式断点
- `lg` ≥1200px 标准三栏
- `md` 992–1199px 侧边栏收起
- `sm` <992px 提示使用大屏

---

## 12. 最终说明

本说明书覆盖后端架构、数据库、API、业务逻辑、前端组件及**完整的视觉样式规范**，可直接用于 AI 编程工具生成可运行代码。样式基于 Ant Design 可定制主题，保证实现一致性。

**文档结束**