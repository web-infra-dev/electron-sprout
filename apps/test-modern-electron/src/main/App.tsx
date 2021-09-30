import bridge, { IUpdateProgressInfo } from '@modern-js/runtime/electron-bridge';
import { Switch, Route } from '@modern-js/runtime/router';
import { useEffect } from 'react';
const App: React.FC = () => {
  useEffect(() => {
    const idleListener = bridge.updateService.onUpdateIdle(() => {
      console.log('暂无可用更新版本');
    });
    const updateProgressListener = bridge.updateService.onUpdateProgress((progress: IUpdateProgressInfo) => {
      console.log('升级进度信息:', progress);
    });
    const updateErrorListener = bridge.updateService.onUpdateError((err: any) => {
      console.error('升级失败:', err);
    });
    const updateDoneListener = bridge.updateService.onUpdateDone(() => {
      console.error('升级完成, 重启');
      bridge.updateService.restartAndInstall();
    });
    return () => {
      // 解除监听
      idleListener.dispose();
      updateProgressListener.dispose();
      updateErrorListener.dispose();
      updateDoneListener.dispose();
    }
  }, [])
  return (
      <Switch>
      <Route exact={true} path="/">
        <div>
          <div>Hello Jupiter!</div>
          <button
            type="button"
            onClick={() => {
            bridge.startToUpdate('https://xx/xx')
          }}>
            检测更新
          </button>
          <webview
            src={
              "https://www.baidu.com"
            }
            id="webview1"
            // @ts-expect-error
            nodeintegration="true"
            preload={bridge.getWebviewPreloadJs()}
            style={{
              width: '100%',
              height: 300,
            }}>

          </webview>
          <webview
            src={
              "https://www.baidu.com"
            }
            id="webview2"
            // @ts-expect-error
            nodeintegration="true"
            preload={bridge.getWebviewPreloadJs()}
            style={{
              width: '100%',
              height: 300,
            }}>

          </webview>

        </div>

      </Route>
      <Route path="*">
        <div>404</div>
      </Route>
    </Switch>
  );
};

export default App;
