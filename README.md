# 北京天气

这是一个面向 Kindle 浏览器的纯静态天气页，默认展示北京天气，数据来自 Open-Meteo，不需要构建工具、后端服务或 API Key。

## 展示内容

页面只显示这些信息：

- 当天日期
- 符号形式的天气状况
- 当前气温
- 风力风向
- 湿度
- 天气
- 最高最低气温
- 去年今日天气
- 前年今日天气
- 数据更新时间

## 运行方式

1. 直接打开 `index.html` 即可。
2. 也可以把整个仓库部署到 GitHub Pages。

## 自动刷新

页面会按小时级间隔自动刷新，默认是 1 小时一次。

如果你想改成 2 小时或其他小时数，只需要修改 `index.html` 里的 `data-refresh-hours` 和 `meta refresh` 时间即可。

## 目录结构

```
kindle-weather-web
├── index.html
├── css
│   └── styles.css
├── js
│   └── app.js
└── README.md
```

## 兼容性说明

这个版本尽量使用了老浏览器也能理解的写法，以提高 Kindle 4 上的可用性。页面本身仍然依赖网络访问 Open-Meteo。
