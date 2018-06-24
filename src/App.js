import React from 'react';
import { Page, Title, P } from './common';
import Teaser from './Teaser';
import Login from './Login';
import { createSwitchNavigator } from '@react-navigation/core';

import AContext from './aContext';
import Aven from './aven-client/Aven';
import createSidebarPage from './createSidebarPage';

const Docs = createSidebarPage([
  require('./docs/GettingStarted').default,
  require('./docs/DispatchingActions').default,
  require('./docs/UserAuth').default,
  require('./docs/StoringDocs').default,
  require('./docs/DocVersions').default,
  require('./docs/Permissions').default,
  require('./docs/Websockets').default,
]);

const Home = ({ navigation }) => (
  <Page>
    <Title>Welcome to Aven</Title>
    <P>content...</P>
  </Page>
);
Home.title = null;

const About = ({ navigation }) => (
  <Page>
    <Title>About Aven</Title>
    <P>Coming Soon.</P>
  </Page>
);
About.title = 'About';

const AppNavigator = createSwitchNavigator(
  {
    Teaser,
    docs: Docs,
    login: Login,
    about: About,
    home: Home,
  },
  {
    navigationOptions: ({ navigation, navigationOptions }) => {
      const {
        state,
        router,
        getChildNavigation,
        dangerouslyGetParent,
      } = navigation;
      const baseName = 'Aven Cloud';
      const parent = dangerouslyGetParent();
      let title = baseName;
      if (!router && parent && parent.router) {
        const screen = parent.router.getComponentForRouteName(state.routeName);
        if (screen && screen.title) {
          title = `${screen.title} : ${baseName}`;
        }
      }
      if (router) {
        const { routes, index } = state;
        const activeRoute = routes[index];
        const activeChild = getChildNavigation(activeRoute.key);
        const opts = router.getScreenOptions(activeChild);
        const childTitle = opts.title;
        if (childTitle) {
          title = `${childTitle} : ${baseName}`;
        }
      }

      return { title };
    },
  },
);

const aven = new Aven({
  host: 'localhost:8080',
  disableHTTPS: true,
  onCookieData: () => {},
  cookieData: {},
  domain: 'aven.io',
});

const App = ({ navigation }) => (
  <AContext.Provider value={aven}>
    <AppNavigator navigation={navigation} />
  </AContext.Provider>
);
App.router = AppNavigator.router;

export default App;
