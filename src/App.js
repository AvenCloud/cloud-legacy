import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';

const Button = ({ title, onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <Text>{title}</Text>
  </TouchableOpacity>
);
const ScreenTitle = ({ children }) => <Text>{children}</Text>;
const ScreenContainer = ({ children }) => <View>{children}</View>;

const LoginScreen = () => (
  <ScreenContainer>
    <ScreenTitle>Login</ScreenTitle>
  </ScreenContainer>
);
const LogoutScreen = () => (
  <ScreenContainer>
    <ScreenTitle>Logout</ScreenTitle>
  </ScreenContainer>
);
const RegisterScreen = () => (
  <ScreenContainer>
    <ScreenTitle>Register</ScreenTitle>
  </ScreenContainer>
);

const screens = {
  LoginScreen,
  LogoutScreen,
  RegisterScreen,
};

const LinkBar = ({ onLink }) => {
  const links = Object.keys(screens).map(screenName => (
    <View style={{ padding: 20 }}>
      <Button
        key={screenName}
        onPress={() => {
          console.log('dude');
          onLink(screenName);
        }}
        title={screenName + ' ok'}
      />
    </View>
  ));
  return <View style={{ flexDirection: 'row', borderWidth: 2 }}>{links}</View>;
};

class App extends React.Component {
  state = {
    activeScreen: 'LoginScreen',
  };
  render() {
    const ActiveScreen = screens[this.state.activeScreen];
    return (
      <View style={{ borderWidth: 12, borderColor: 'green' }}>
        <Button title="ugh" onPress={() => {}} />
        <a
          onClick={() => {
            console.log('shit');
          }}>
          shit
        </a>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            justifyContent: 'center',
            minHeight: '100%',
          }}>
          <LinkBar
            onLink={activeScreen => {
              debugger;
              console.log('ok wtf', activeScreen);
              this.setState({ activeScreen });
            }}
          />
          {ActiveScreen && <ActiveScreen />}
        </ScrollView>
      </View>
    );
  }
}

export default App;
