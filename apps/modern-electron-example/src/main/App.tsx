// import * as fs from 'fs';
import { Switch, Route } from '@modern-js/runtime/router';
import bridge from '@modern-js/runtime/electron-bridge';
// import { useEffect } from 'react';

// const preload = bridge.getWebviewPreloadJs();
// console.log('preload:', preload);

// console.log('fs:', fs.existsSync);

const App: React.FC = () => (
  // useEffect(() => {
  //   const webview = bridge.webviewService.getWebviewById('webview1');
  //   webview.addEventListener('dom-ready', () => {
  //     webview.openDevTools();
  //   });
  // }, []);
  // console.log('preloa11d:', bridge.getWebviewPreloadJs());
  <Switch>
    <Route exact={true} path="/">
      <div>
        <div>Hello Moderns!</div>

        <button
          type="button"
          onClick={() => {
            bridge.startToUpdate('https://xx/xx');
          }}>
          检测更新
        </button>

        <button
          type="button"
          onClick={() => {
            bridge.openWindow('ssr');
          }}>
          打开 ssr 窗口
        </button>
        <button
          type="button"
          onClick={() => {
            bridge.openWindow('upgrade');
          }}>
          打开 升级 窗口
        </button>
        <webview
          src={'https://www.jianshu.com'}
          id="webview1"
          // @ts-expect-error
          nodeintegration="true"
          preload={bridge.getWebviewPreloadJs()}
          style={{
            width: '100%',
            height: 300,
          }}></webview>
        <webview
          src={'https://www.jianshu.com'}
          id="webview2"
          // @ts-expect-error
          nodeintegration="true"
          preload={bridge.getWebviewPreloadJs()}
          style={{
            width: '100%',
            height: 300,
          }}></webview>
      </div>
    </Route>
    <Route path="*">
      <div>404</div>
    </Route>
  </Switch>
);
export default App;
