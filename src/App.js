import React from 'react';
import {
  // ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

// const Video = ({ vimeoId }) => (
//   <iframe
//     title="Video Player"
//     src={`https://player.vimeo.com/video/${vimeoId}`}
//     width="1280"
//     height="720"
//     frameBorder="0"
//     allowFullScreen
//   />
// );

// const Button = ({ title, onPress }) => (
//   <TouchableOpacity onPress={onPress}>
//     <Text>{title}</Text>
//   </TouchableOpacity>
// );
// const ScreenTitle = ({ children }) => <Text>{children}</Text>;
// const ScreenContainer = ({ children }) => <View>{children}</View>;

class App extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View
          style={{
            width: '100%',
            maxHeight: 460,
            flex: 1,
            marginVertical: 100,
            position: 'relative',
          }}>
          <Image
            source={require('./images/cloudGlamour.png')}
            style={{
              ...StyleSheet.absoluteFillObject,
              resizeMode: 'contain',
            }}
          />
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Image
              source={require('./images/AvenLogoPlain.png')}
              style={{
                resizeMode: 'contain',
                width: '100%',
                height: '18%',
              }}
            />
          </View>
        </View>
      </View>
    );
  }
}

// {/* <ScrollView
//   style={StyleSheet.absoluteFill}
//   contentContainerStyle={{
//     justifyContent: 'center',
//     minHeight: '100%',
//   }}>
//   <LinkBar
//     onLink={activeScreen => {
//       this.setState({ activeScreen });
//     }}
//   />
//   {ActiveScreen && <ActiveScreen />}
// </ScrollView> */}
export default App;
