import React from 'react';
import { withA } from './aContext';
import { View, Text, ScrollView, TouchableHighlight } from 'react-native';
import {
  Button,
  Page,
  Title,
  Form,
  FormInput,
  FormSubmit,
  Sidebar,
  SidebarLink,
  Colors,
} from './common';
import Avatar from '@material-ui/core/Avatar';
import AppBar from '@material-ui/core/AppBar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import withNavigation from '@react-navigation/core/lib/withNavigation';
import DraftsIcon from '@material-ui/icons/Drafts';
import PeopleIcon from '@material-ui/icons/People';
import FolderIcon from '@material-ui/icons/Folder';

import { createSwitchNavigator } from '@react-navigation/core';
const Icon = ({ name }) => (
  <i
    className={`fas fa-${name}`}
    style={{ color: Colors.header, marginRight: 15, fontSize: 32 }}
  />
);

const DashboardPage = ({ children, title, icon, headerRight }) => (
  <View style={{ flex: 1 }}>
    <AppBar position="static" color="default">
      <Toolbar>
        <Typography variant="title" color="inherit">
          Title
        </Typography>
      </Toolbar>
    </AppBar>
    <View
      style={{
        backgroundColor: '#f2f2f2',
        minWidth: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        padding: 20,
        flexDirection: 'row',
      }}>
      {icon}
      <Text style={{ fontSize: 32, color: Colors.header }}>{title}</Text>
      <View style={{ flex: 1 }} />
      {headerRight}
    </View>
    {children}
  </View>
);

const FilesPage = () => (
  <DashboardPage
    title="Files"
    icon={<FolderIcon />}
    headerRight={
      <React.Fragment>
        <Button title="New file" />
        <Button title="Info" />
      </React.Fragment>
    }>
    <Title>Files</Title>
  </DashboardPage>
);

const AccountPageNav = ({ navigation }) => (
  <DashboardPage
    title={`Account - ${navigation.getParam('id')}`}
    icon={<Avatar className="">HY</Avatar>}
    headerRight={
      <React.Fragment>
        <Button title="Reset Password" />
        <Button title="Delete Account" />
      </React.Fragment>
    }>
    <Title>Account</Title>
  </DashboardPage>
);
const AccountPage = withNavigation(AccountPageNav);
AccountPage.path = 'account/:id';

const AccountListItemNav = ({ account, navigation }) => {
  return (
    <TouchableHighlight
      onPress={() => {
        navigation.navigate('account', { id: account.name });
      }}
      style={{
        alignSelf: 'stretch',
      }}>
      <View
        style={{
          padding: 10,
          alignSelf: 'stretch',
          flexDirection: 'row',
          backgroundColor: Colors.page,
        }}>
        <Avatar className="">HY</Avatar>
        <Text style={{ fontSize: 26, marginHorizontal: 15, marginVertical: 3 }}>
          {account.name}
        </Text>
      </View>
    </TouchableHighlight>
  );
};
const AccountListItem = withNavigation(AccountListItemNav);

class AccountList extends React.Component {
  render() {
    return (
      <View>
        {Array(50)
          .fill(null)
          .map((a, i) => (
            <AccountListItem key={i} account={{ name: 'Henry Young' }} />
          ))}
      </View>
    );
  }
}

const AccountsPage = () => (
  <DashboardPage
    title="Accounts"
    icon={<PeopleIcon />}
    headerRight={
      <React.Fragment>
        <Button title="New Account" />
      </React.Fragment>
    }>
    <AccountList />
  </DashboardPage>
);

const DashNavigator = createSwitchNavigator({
  accounts: AccountsPage,
  files: FilesPage,
  account: AccountPage,
});

class DashboardWithA extends React.Component {
  render() {
    const { navigation, aven } = this.props;
    return (
      <Page>
        <View style={{ flexDirection: 'row', flex: 1 }}>
          <Sidebar>
            <SidebarLink
              title={'Accounts'}
              to={'accounts'}
              icon={<PeopleIcon />}
            />
            <SidebarLink title={'Files'} to={'files'} icon={<FolderIcon />} />
          </Sidebar>
          <DashNavigator navigation={navigation} />
        </View>
      </Page>
    );
  }
}

const Dashboard = withA(DashboardWithA);

Dashboard.title = 'Dashboard';
Dashboard.router = DashNavigator.router;

export default Dashboard;
