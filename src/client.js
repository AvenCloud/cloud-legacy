import { AppRegistry } from 'react-native';
import { createBrowserApp } from '@react-navigation/web';

import AppNavigator from './App';

const App = createBrowserApp(AppNavigator);

AppRegistry.registerComponent('App', () => App);

AppRegistry.runApplication('App', {
  initialProps: {},
  rootTag: document.getElementById('root'),
});

if (module.hot) {
  module.hot.accept();
}
