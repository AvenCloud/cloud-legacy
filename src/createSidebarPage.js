import React from 'react';
import { View } from 'react-native';
import {
  SwitchRouter,
  NavigationProvider,
  createNavigator,
} from '@react-navigation/core';
import { Page, Sidebar, SidebarLink } from './common';

const createSidebarPage = pages => {
  const namedPages = {};
  pages.forEach(page => {
    namedPages[page.navigationOptions.routeName] = page;
  });

  const PageSidebar = () => (
    <Sidebar>
      {pages.map((page, index) => (
        <SidebarLink
          key={index}
          title={page.navigationOptions.title}
          to={page.navigationOptions.routeName}
        />
      ))}
    </Sidebar>
  );

  class PageView extends React.Component {
    render() {
      const { state } = this.props.navigation;
      const routeKey = state.routes[state.index].key;
      const descriptor = this.props.descriptors[routeKey];
      const { getComponent, navigation } = descriptor;
      const Screen = getComponent();

      return (
        <Page>
          <View style={{ flexDirection: 'row', flex: 1 }}>
            <PageSidebar />
            <NavigationProvider value={navigation}>
              <Screen navigation={navigation} />
            </NavigationProvider>
          </View>
        </Page>
      );
    }
  }

  const Router = SwitchRouter(namedPages, {
    navigationOptions: { title: 'wat' },
  });

  return createNavigator(PageView, Router, {
    navigationOptions: { title: 'woa' },
  });
};

export default createSidebarPage;
