import React from 'react';
import { ScrollView, StyleSheet, View, Text, Button } from 'react-native';

class App extends React.Component {
  render() {
    const { dispatch } = this.props;
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          justifyContent: 'center',
          minHeight: '100%',
        }}>
        <Text>HJello</Text>
      </ScrollView>
    );
  }
}

export default App;
