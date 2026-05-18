# 云端同步方案

手机端学习进度会上传到你自己的 Cloudflare Worker，Worker 再保存到 Cloudflare KV。

## Cloudflare 设置

1. 打开 Cloudflare Dashboard。
2. 新建一个 KV namespace，例如 `kaoyan_daily_sync`。
3. 新建 Worker，把 `cloud-sync.cloudflare-worker.js` 的内容复制进去。
4. 给 Worker 绑定 KV：
   - Binding name：`SYNC_KV`
   - KV namespace：选择刚才创建的 `kaoyan_daily_sync`
5. 可选：在 Worker 环境变量里新增 `SYNC_SALT`，填一串你自己知道的随机文本。
6. 部署 Worker，得到一个 HTTPS 地址。

## App 设置

1. 打开 App 的“我的 → 云端同步”。
2. “同步地址”填 Worker 的 HTTPS 地址。
3. “同步码”填一串你自己记得住、但别人猜不到的文本，至少 8 位。
4. 点“上传到云端”保存当前手机进度。
5. 换手机或重装后，填同一个同步地址和同步码，点“从云端恢复”。

## 注意

- 云端备份不会上传本地 DeepSeek API Key。
- 同步码相当于密码，不要告诉别人。
- 如果同步码忘了，就无法从旧备份恢复；可以用新同步码重新上传一份。
- GitHub 只负责代码和打包，学习进度不上传到 GitHub。
