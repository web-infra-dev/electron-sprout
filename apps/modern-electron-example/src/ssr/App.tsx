import { Switch, Route } from '@modern-js/runtime/router';

// callToBroadCast();
const App: React.FC = () => {
  if (typeof window !== 'undefined') {
    window.bridge.callMain('getWindowCount').then(console.log);
  }
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
