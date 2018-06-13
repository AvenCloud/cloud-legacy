import React from 'react';
import {
  Text,
  View,
  TouchableHighlight,
  ScrollView,
  StyleSheet,
} from 'react-native';
import linkContext from './docs/linkContext';
import {
  SwitchRouter,
  createNavigator,
  withNavigation,
} from '@react-navigation/core';

const pages = [
  require('./docs/GettingStarted').default,
  require('./docs/DispatchingActions').default,
  require('./docs/UserAuth').default,
  require('./docs/StoringDocs').default,
  require('./docs/DocVersions').default,
  require('./docs/Permissions').default,
  require('./docs/Websockets').default,
];

const namedPages = {};
pages.forEach(page => {
  namedPages[page.info.routeName] = page;
});

const SidebarLinkWithNav = ({ navigation, page }) => {
  const { state } = navigation;
  const activeRouteName = state.routes[state.index].routeName;
  const isActive = activeRouteName === page.info.routeName;
  return (
    <TouchableHighlight
      key={page.info.routeName}
      onPress={() => {
        navigation.navigate(page.info.routeName);
      }}>
      <View
        style={{
          padding: 10,
          backgroundColor: isActive ? '#337' : '#eee',
        }}>
        <Text
          style={{
            color: isActive ? 'white' : 'black',
          }}>
          {page.info.title}
        </Text>
      </View>
    </TouchableHighlight>
  );
};
const SidebarLink = withNavigation(SidebarLinkWithNav);
const Sidebar = ({ onOpenDoc, activeDoc }) => (
  <ScrollView
    style={{
      maxWidth: 300,
      backgroundColor: '#eee',
      height: '100%',
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: '#ccc',
    }}>
    {pages.map(page => <SidebarLink page={page} />)}
  </ScrollView>
);

class DocsView extends React.Component {
  state = { activeDoc: pages[0].info.routeName };
  _onOpenDoc = activeDoc => {
    this.setState({ activeDoc });
  };
  render() {
    const { state } = this.props.navigation;
    const routeKey = state.routes[state.index].key;
    const descriptor = this.props.descriptors[routeKey];
    const { getComponent } = descriptor;
    const DocScreen = getComponent();
    const { Provider } = linkContext;
    return (
      <Provider value={this._onOpenDoc}>
        <View style={{ flexDirection: 'row', flex: 1 }}>
          <Sidebar onOpenDoc={this._onOpenDoc} activeDoc={null} />
          <DocScreen onOpenDoc={this._onOpenDoc} />
        </View>
      </Provider>
    );
  }
}

const Router = SwitchRouter(namedPages);

const Docs = createNavigator(DocsView, Router, {});

export default Docs;
