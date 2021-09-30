import bridge from '@modern-js/runtime/electron-bridge';
import { Switch, Route } from '@modern-js/runtime/router';

// callToBroadCast();
const App: React.FC = () => {
  bridge.callMain('getWindowCount').then(res => {
    console.log('res:', res);
  })
  return (
    <Switch>
      <Route exact={true} path="/">
        <div>
          <div>Demo</div>
        </div>

      </Route>
      <Route path="*">
        <div>404</div>
      </Route>
    </Switch>
  );
};

export default App;
