import React from 'react';
import {
  ScrollView,
  View,
  Text,
  // StyleSheet,
  Image,
  TouchableHighlight,
  TouchableWithoutFeedback,
  TextInput,
} from 'react-native';
import { withNavigation } from '@react-navigation/core';
import { Formik } from 'formik';

const pageWidth = 1200;
const pagePadding = 30;
const activeBg = '#337';
const headerLinkColor = '#778';
const headerLinkActiveColor = '#112';
const textColor = '#223';
export const pageColor = '#f9f9fc';

const LinkViewWithNav = ({
  navigation,
  to,
  children,
  feedback,
  style,
  activeStyle,
}) => {
  const { state } = navigation;
  let isActive = false;
  if (state.routes) {
    const activeRouteName = state.routes[state.index].routeName;
    isActive = activeRouteName === to;
  }
  const s = isActive ? [style, activeStyle] : style;
  const T =
    feedback === 'highlight' ? TouchableHighlight : TouchableWithoutFeedback;
  return (
    <T
      onPress={() => {
        navigation.navigate(to);
      }}>
      <View style={s}>
        {typeof children === 'function' ? children(isActive) : children}
      </View>
    </T>
  );
};
export const LinkView = withNavigation(LinkViewWithNav);

export const SidebarLink = ({ navigation, title, to }) => {
  return (
    <LinkView
      feedback="highlight"
      to={to}
      style={{
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#eee',
      }}
      activeStyle={{ backgroundColor: activeBg }}>
      {isActive => (
        <Text
          style={{
            color: isActive ? 'white' : textColor,
          }}>
          {title}
        </Text>
      )}
    </LinkView>
  );
};

export const Sidebar = ({ children }) => (
  <View
    style={{
      borderRightWidth: 1,
      borderRightColor: '#ccc',
    }}>
    <ScrollView
      style={{
        maxWidth: 300,
        backgroundColor: '#eee',
        height: '100%',
      }}
      contentContainerStyle={{ minHeight: '100%', paddingVertical: 10 }}>
      {children}
    </ScrollView>
  </View>
);

const HeaderLinkWithNav = ({ title, navigation, to }) => (
  <TouchableHighlight
    onPress={() => {
      navigation.navigate(to);
    }}>
    <View
      style={{
        backgroundColor: pageColor,
        paddingVertical: 15,
        paddingHorizontal: 15,
      }}>
      <Text
        style={{
          color:
            navigation.state.routeName === to
              ? headerLinkActiveColor
              : headerLinkColor,
          fontSize: 20,
        }}>
        {title}
      </Text>
    </View>
  </TouchableHighlight>
);

const HeaderLink = withNavigation(HeaderLinkWithNav);

export const Page = ({ children }) => (
  <React.Fragment>
    <View style={{ minHeight: 50 }}>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'center',
        }}>
        <View
          style={{
            flex: 1,
            alignSelf: 'stretch',
            maxWidth: pageWidth,
            flexDirection: 'row',
          }}>
          <LinkView
            to="home"
            style={{
              marginHorizontal: pagePadding + 20,
            }}>
            <Image
              source={require('./images/AvenLogoPlain.png')}
              style={{
                resizeMode: 'contain',
                width: 100,
                height: 50,
              }}
            />
          </LinkView>
          <View style={{ flex: 1 }} />
          <View style={{ marginHorizontal: pagePadding, flexDirection: 'row' }}>
            <HeaderLink title="Docs" to="docs" />
            <HeaderLink title="Blog" to="about" />
            <HeaderLink title="Login" to="login" />
          </View>
        </View>
      </View>
    </View>
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
      }}>
      <View
        style={{
          flex: 1,
          alignSelf: 'stretch',
          maxWidth: pageWidth,
        }}>
        <View
          style={{
            marginHorizontal: pagePadding,
            borderWidth: 1,
            borderColor: '#aaa',
            backgroundColor: '#fdfdff',
          }}>
          {children}
        </View>
      </View>
    </View>
  </React.Fragment>
);

export const Title = ({ children }) => (
  <View style={{ marginVertical: 30 }}>
    <Text style={{ fontSize: 40 }}>{children}</Text>
  </View>
);
export const P = ({ children }) => (
  <View style={{ marginVertical: 10 }}>
    <Text style={{ fontSize: 16 }}>{children}</Text>
  </View>
);

export const FormInput = () => <TextInput />;
export const FormSubmit = () => <TextInput />;

export class Form extends React.Component {
  render() {
    return (
      <Formik
        initialValues={{
          nameOrEmailOrPhone: '',
          password: '',
        }}
        validate={values => {
          const errors = {};
          if (values.password.length < 6) {
            return (errors.password = 'Enter full password');
          }
          return errors;
        }}
        onSubmit={this.props.onSubmit}
        render={({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          isSubmitting,
        }) =>
          this.props.render({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            isSubmitting,
          })
        }
      />
    );
  }
}
