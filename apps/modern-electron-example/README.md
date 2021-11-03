## 启动

```bash
pnpm run dev  # 启动渲染进程
pnpm run dev:main # 启动主进程
pnpm run dev:electron # 一行命令启动，先启动渲染进程，在启动主进程
```

## 构建

```bash
pnpm run build:electron # 构建应用
```

## 测试

- 启动构建后的前端

```bash
pnpm run build
pnpm run start
```

- 开始测试

```bash
pnpm run test
```
