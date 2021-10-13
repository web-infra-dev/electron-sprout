# Your MWA

## Prerequisites

1. [Node.js LTS](https://github.com/nodejs/Release)
    * [Automatically call nvm use](https://github.com/nvm-sh/nvm#deeper-shell-integration)
2. Yarn Classic (>= 1.21, < 2)
    * `brew install yarn`

## Get Started

安装或重装所有依赖，内置了缓存机制，安装速度更快

```
yarn setup
```

按开发环境的要求，运行和调试项目

```
yarn dev
```

一键部署预览版

```
yarn preview
```

继续创建更多项目要素，比如应用入口

```
yarn new
```

其他

```
pnpm build        # 按产品环境的要求，构建项目
yarn start        # 按产品环境的要求，运行项目
yarn test         # 运行测试用例
yarn lint:error   # 检查和修复所有代码
```
