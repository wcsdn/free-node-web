# 态势监控仪表板

一个专注于地缘政治的新闻聚合仪表板，配备3D地球可视化功能，专为监控全球局势、美国政策变化和冲突地区而设计。

## 功能特性

- **5个地缘政治分类**：美国政策监控、地缘政治、冲突地区、国防与情报、经济战
- **3D交互式地球**：基于Globe.gl的可视化，按地理位置展示新闻
- **Twitter/X集成**：嵌入式OSINT推文面板（免费，无需API密钥）
- **快速过滤器**：一键筛选特朗普、乌克兰、中国、以色列、俄罗斯、北约、台湾、伊朗相关内容
- **实时搜索**：按关键词筛选文章
- **暗色"作战室"主题**：专业的监控界面
- **自动刷新**：每30分钟更新数据源

## 截图

- **仪表板**：分类标签、搜索、来源过滤、文章卡片
- **地球视图**：带可点击位置标记的交互式3D地球

## 快速开始

```bash
cd /Users/rohangodse/dev/Newstracker

# 安装依赖
pip install -r requirements.txt

# 运行应用
python app.py

# 在浏览器中打开
open http://localhost:5001
```

## RSS数据源

### 美国政策监控
- 白宫、POLITICO Playbook、Axios、BBC美国与加拿大、纽约时报政治版、路透社

### 地缘政治
- 对外关系委员会、外交政策、半岛电视台、BBC世界、外交官、南华早报、中东之眼、战争地带

### 冲突地区
- 路透社世界、半岛电视台、BBC（中东、欧洲、非洲、亚洲）、战争研究所

### 国防与情报
- 国防新闻、Breaking Defense、战争地带、C4ISRNET、简氏防务、Bellingcat

### 经济战
- 路透社商业、彭博市场、金融时报、经济学人、商业标准

## 项目结构

```
Newstracker/
├── app.py              # Flask后端、RSS抓取器、API路由
├── templates/
│   ├── index.html     # 主仪表板
│   └── globe.html     # 3D地球可视化
├── static/
│   └── style.css      # 暗色主题样式
├── news.db            # SQLite数据库（自动创建）
├── requirements.txt   # Python依赖
└── README.md
```

## API端点

| 端点 | 方法 | 描述 |
|----------|--------|-------------|
| `/` | GET | 主仪表板 |
| `/globe` | GET | 地球可视化 |
| `/api/articles` | GET | 获取文章（支持 `?category=`、`?source=`、`?search=`） |
| `/api/sources` | GET | 列出所有来源 |
| `/api/globe-data` | GET | 用于地球展示的位置聚合数据 |
| `/api/stats` | GET | 仪表板统计信息 |
| `/api/refresh` | POST | 手动触发数据源刷新 |

## 自定义Twitter推文流

侧边栏包含嵌入的X（Twitter）列表。要使用您自己的OSINT列表：

1. 在X上创建一个包含您关注账户的公开列表
2. 访问 https://publish.twitter.com
3. 输入您的列表URL并获取嵌入代码
4. 替换 `templates/index.html` 中的嵌入代码

推荐的OSINT账户：
- @sentdefender
- @TheStudyofWar
- @RALee85
- @Tom_ftr
- @ABORbureau

## 技术栈

- **后端**：Flask、feedparser、APScheduler、SQLite
- **前端**：原生JavaScript、CSS3
- **地球可视化**：Globe.gl（WebGL）
- **字体**：JetBrains Mono、Inter

## 注意事项

- 使用端口5001（5000端口在macOS上与AirPlay冲突）
- 首次启动时会抓取所有数据源（约30-60秒）
- 数据库在首次运行时自动创建
- 数据源每30分钟自动刷新