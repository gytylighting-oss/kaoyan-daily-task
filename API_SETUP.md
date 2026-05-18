# DeepSeek API 方案

不要把 DeepSeek API Key 写进前端、GitHub 或 IPA 包里。正确做法是放到云端代理的环境变量中，App 只保存代理地址。

## 本机自用方案：直接填 Key

如果只是自己在本机用，可以在 App 的“我的 → DeepSeek 批改接口”里填写“本地 API Key”。

- Key 会保存在当前浏览器/本机 App 数据里。
- 输入框默认用星号隐藏，点“显示”可以看明文，点“复制 Key”可以复制出来。
- 用 `npm start` 打开本地网页时，App 会请求本机 `/api/deepseek`，由 `server.js` 转发到 DeepSeek，避免浏览器跨域问题。
- 不要把带 Key 的备份文件发给别人。

## 推荐方案：Cloudflare Worker

1. 注册 Cloudflare。
2. 新建 Worker。
3. 把 `deepseek-proxy.cloudflare-worker.js` 的内容复制进去。
4. 在 Worker 的环境变量里新增：
   - `DEEPSEEK_API_KEY`
   - 值填你的 DeepSeek key
5. 部署后得到一个 HTTPS 地址。
6. 在 App 设置页的“AI 代理地址”填这个 Worker 地址。

## 为什么这样做

- App 里不出现密钥。
- GitHub 公开仓库不会泄露密钥。
- 以后 iPhone、iPad 都走同一个 AI 服务。
- 后面可以在 Worker 里加限流、登录校验和用量记录。
