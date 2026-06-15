# 日常履历沉淀与智能简历生成器

## 项目定位

"记录‑分析‑生成"闭环系统：日常积累履历素材 → 自动提取技能关键词 → 低代码拖拽式编辑器 → 一键导出 .docx 简历。

## 技术栈（已确认）

| 层面 | 选型 | 说明 |
|------|------|------|
| 前端 | React 18 + Ant Design 5 + Zustand | 状态管理用 Zustand，非 Redux |
| 拖拽编辑 | react-grid-layout + react-dnd | 基于模板框架编辑（非完全自由排版） |
| 后端 | Spring Boot 2.7+ | RESTful API，Maven 项目 |
| 分词 | HanLP 1.x portable | 直接引入 JAR，**不要用 2.x（需独立服务）** |
| 数据库 | MongoDB | 本地 localhost:27017，数据库名 `resume_builder` |
| 文档生成 | poi-tl 1.12+ | 基于 .docx 模板标签 `{{}}` 渲染 |
| 认证 | Spring Security + JWT | 前后端分离 |
| 文件存储 | 本地文件系统（开发）/ 阿里云 OSS（生产） | |
| 项目结构 | Monorepo | `frontend/` + `backend/` 同仓库 |

## 项目结构（计划）

```
简历生成器/
├── AGENTS.md
├── UI设计原型.html              # 已创建的可交互设计原型
├── 简历生成器系统需求说明文档.md
├── 项目系统设计说明书_面向AI编程 (1).md
│
├── frontend/                    # React 项目
│   ├── src/
│   │   ├── pages/               # 页面组件
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── RecordsPage.tsx
│   │   │   ├── EditorPage.tsx
│   │   │   ├── TemplatesPage.tsx
│   │   │   └── MyLayoutsPage.tsx
│   │   ├── components/          # 通用组件
│   │   │   ├── SkillCloud.tsx   # echart-wordcloud
│   │   │   ├── RecordFormModal.tsx
│   │   │   ├── DragCanvas.tsx
│   │   │   ├── ComponentLibrary.tsx
│   │   │   └── PropertyPanel.tsx
│   │   ├── stores/              # Zustand stores
│   │   ├── api/                 # axios 封装 + API 调用
│   │   └── utils/
│   └── package.json
│
└── backend/                     # Spring Boot 项目
    └── src/main/
        ├── java/com/resumebuilder/
        │   ├── entity/          # @Document MongoDB 实体
        │   ├── repository/      # MongoRepository
        │   ├── controller/      # @RestController
        │   ├── service/
        │   ├── config/          # JWT 过滤、HanLP、CORS
        │   └── util/
        └── resources/
            ├── application.yml
            └── hanlp/
                ├── custom_dict.txt   # 计算机技能词典
                └── stopwords.txt     # 停用词表
```

## 设计决策（重要约束）

1. **编辑器定位：拖拽式模板搭建工具**（关键订正）
   - 用户用编辑器**从零搭建简历模板布局**：拖拽组件（文本框、列表、分割线等）到画布，调整位置和大小，配置样式属性
   - 编辑器也支持**从模板市场选用预设模板**，加载后继续编辑
   - 编辑好的布局可**保存为用户的布局**，也可**发布为模板分享到市场**
   - 布局中的列表组件（如"项目经历"）通过 `binding` 字段绑定到日常记录数据源，如 `records[type=project]`
   - Word 模板（.docx）仅作为导出渲染引擎，与编辑器布局通过 `wordTemplateKey` 关联

2. **HanLP 版本：1.x portable**（用户已确认）
   - Maven 坐标：`com.hankcs:hanlp:portable-1.8.4`
   - 自定义词典路径：`classpath:hanlp/custom_dict.txt`
   - **不要引入 2.x 版本**（需要独立服务进程，增加部署复杂度）

3. **组件数据绑定约定**
   - 布局 JSON 中 `binding` 字段值格式：
     - `user.name` / `user.email` → 用户属性
     - `records[type=project]` → 按类型筛选日常记录（支持：project, internship, competition, skill, certification, other, education）
   - 后端 ExportController 解析 binding 并查询 MongoDB

4. **布局 JSON → Word 模板映射**
   - 每个模板有一个 `wordTemplateKey`（如 `tech_blue.docx`）
   - 导出流程：前端传入 `layoutId` → 后端获取布局 → 从布局的 `templateId` 找到 `Template` → 获取 `wordTemplateKey` → 解析布局组件 binding 字段拉取数据 → poi-tl 渲染 → 返回 .docx
   - 前端预览为 HTML/CSS 渲染，导出为 poi-tl Word 渲染，两者不可能 100% 一致，目标为 80% 相似度

## MVP 构建顺序

```
Phase 1: 项目脚手架（Spring Boot + React 项目初始化）
Phase 2: 用户认证（注册/登录/JWT）
Phase 3: 日常记录 CRUD API + 前端页面
Phase 4: HanLP 分词 + 技能词频统计 + 词云展示
Phase 5: 拖拽编辑器雏形（基于模板，保存/加载 JSON）
Phase 6: poi-tl Word 模板 + 导出 API + 前后端联调
Phase 7: 模板市场（列表/选用/上传）
```

## API 基础约定

- 基础路径：`/api/v1`
- 认证：`Authorization: Bearer <JWT>`
- 统一响应格式：`{ code: number, data: any, message: string }`

### 核心接口速览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/register` | 注册 |
| POST | `/auth/login` | 登录 → 返回 token |
| GET | `/auth/me` | 当前用户信息 |
| GET | `/records` | 分页查询（type/keyword/skills 筛选） |
| POST | `/records` | 新增记录 |
| PUT | `/records/{id}` | 更新 |
| DELETE | `/records/{id}` | 软删除 |
| GET | `/records/export` | 导出 CSV/JSON |
| POST | `/records/import` | 批量导入 |
| GET | `/analysis/skills` | 词频统计 |
| GET | `/layouts` | 用户布局列表 |
| POST | `/layouts` | 保存布局 |
| GET | `/layouts/{id}` | 获取布局 JSON |
| GET | `/templates` | 模板列表 |
| GET | `/templates/{id}` | 模板详情 |
| POST | `/templates/{id}/use` | 选用模板 |
| POST | `/export/resume` | 导出 .docx |

完整接口见设计说明书第 4 节。

## 数据库集合

- `users` — 用户（bcrypt 密码）
- `daily_records` — 日常记录（软删除：`deleted` + `deletedAt`）
- `resume_layouts` — 布局 JSON（含 components 数组 + binding）
- `templates` — 模板市场

完整字段定义见设计说明书第 3 节。

## UI 设计规范

设计原型已创建在 `UI设计原型.html`，可直接用浏览器打开查看。关键 token：

```js
// Ant Design 主题
const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 8,
  }
};
```

### 设计系统要点
- 主色 `#1890ff`，悬停 `#40a9ff`，背景 `#f0f2f5`
- 卡片阴影 `0 2px 8px rgba(0,0,0,0.06)`，大阴影 `0 8px 24px rgba(0,0,0,0.12)`
- 模态框圆角 20px，输入框圆角 8px
- 侧边栏 240px（深色 `#001529`），收起 80px
- 编辑器三栏布局：组件库 260px + 画布（800x1123px A4） + 属性面板 300px
- 断点：`≥1200px` 三栏 / `992-1199px` 侧边栏收起 / `<992px` 提示大屏
- 图标统一 `@ant-design/icons`
- 字体：系统字体栈，标题 28/24/20px，正文 14px，辅助 12px

## 关键注意事项（容易踩坑）

1. **poi-tl Word 模板文件**——需要预先创建 `.docx` 文件放入 `resources/templates/`，模板中使用 `{{}}` 标签。系统启动前必须存在至少一个模板。
2. **HanLP 自定义词典**——需提前准备 `custom_dict.txt`，包含常见 CS 技能词（React、Spring Boot、PyTorch 等），否则分词准确率不达标。
3. **MongoDB 索引**——部署前务必创建 `daily_records` 的 `{userId, type, startDate}` 复合索引，否则大数据量下分页查询慢。
4. **软删除**——所有删除操作标记 `deleted=true` 而非物理删除，30 天后可清理。
5. **布局 JSON 版本兼容**——组件 schema 后续可能扩展，`resume_layouts` 中建议预留 `version` 字段。
6. **导出文件命名**——格式固定为 `简历_用户名_生成时间.docx`，注意文件名避免特殊字符。
7. **CORS 配置**——开发环境前端 localhost:3000 → 后端 localhost:8080，需配置跨域。
8. **JWT 密钥**——`application.yml` 中 `jwt.secret` 使用环境变量注入，勿硬编码。
9. **技能词准确率 ≥ 85%**——这是验收标准，自定义词典和停用词表需要持续调优。
10. **简历预览 vs 导出差异**——前端预览是 HTML/CSS 渲染，导出是 poi-tl Word 渲染，两者不可能 100% 一致。目标为 80% 相似度。

## 运行说明

### 环境要求
- **Java**: 17+（可用 IntelliJ IDEA 自带的 JBR，位于 `C:\Program Files\JetBrains\IntelliJ IDEA 2024.2.1\jbr`）
- **Node.js**: 18+
- **MongoDB**: 已运行在 `localhost:27017`

### 启动方式
```bash
# 后端（使用 IntelliJ JBR Java 21）
$env:JAVA_HOME = "C:\Program Files\JetBrains\IntelliJ IDEA 2024.2.1\jbr"
cd backend
..\mvnw.cmd spring-boot:run      # 编译并启动后端 (端口 8080)

# 前端（另一个终端）
cd frontend
npm run dev                       # 启动前端开发服务器 (端口 3000)
```

### 演示账号
- 邮箱：`demo@example.com`
- 密码：`123456`
- 启动后自动创建（仅首次运行）

## 相关文件

- `简历生成器系统需求说明文档.md` — 详细功能需求 V2.1
- `项目系统设计说明书_面向AI编程 (1).md` — 完整系统设计（数据库、API、UI规范）
- `UI设计原型.html` — 可交互的 UI 设计原型（浏览器打开查看）
