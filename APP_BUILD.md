# iPhone/iPad IPA 打包说明

当前项目已经接入 Capacitor，可以生成 iOS 工程，并通过 GitHub Actions 的 macOS 机器打包 unsigned IPA。

## 本地已完成

- 安装 Node.js 后执行 `npm install`
- 生成 `www` 静态资源：`npm run build:www`
- 生成 iOS 工程：`npx cap add ios`
- 同步 iOS 工程：`npx cap sync ios`

Windows 本机没有 Xcode，所以不能直接编译 IPA；真正编译在 GitHub Actions 里完成。

## GitHub 打包流程

1. 创建一个 GitHub 私有仓库。
2. 把本项目推送到仓库。
3. 打开仓库的 Actions 页面。
4. 运行 `Build unsigned iOS IPA`。
5. 下载 artifact：`KaoyanDailyTask-unsigned-ipa`。
6. 把 IPA 发到 iPhone/iPad，用 AltStore 打开安装。

## 注意

- 这是 unsigned IPA，适合 AltStore 重新签名安装。
- 免费 Apple ID 仍然有 7 天签名周期，需要 AltStore/AltServer 续签。
- Apple Watch 第一版建议先走 iPhone 通知同步，watchOS 原生 App 后面单独做。
