import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export const DocPage = ({ children, title }) => (
  <ScrollView
    contentContainerStyle={{ paddingHorizontal: 50, paddingVertical: 20 }}>
    <View>
      {title && (
        <Text style={{ fontSize: 60, fontWeight: 'bold' }}>{title}</Text>
      )}
      {children}
    </View>
  </ScrollView>
);
export const P = ({ children }) => (
  <Text style={{ marginVertical: 8, fontSize: 18, color: '#333' }}>
    {children}
  </Text>
);
export const List = ({ items }) => (
  <View style={{ marginLeft: 20 }}>{items}</View>
);

export const SubTitle = ({ children }) => (
  <Text
    style={{
      marginTop: 40,
      marginBottom: 10,
      fontSize: 28,
      color: '#223',
      fontWeight: 'bold',
    }}>
    {children}
  </Text>
);

export const ExampleAction = ({ action, response }) => (
  <View style={{ padding: 10, backgroundColor: '#eee' }}>
    <Text>Action: {JSON.stringify(action)}</Text>
    <Text>Response: {JSON.stringify(response)}</Text>
  </View>
);

export class Link extends React.Component {
  render() {
    const { toDoc, children } = this.props;
    return (
      <Text
        style={{ color: '#228' }}
        onPress={() => {
          console.log('go to link', toDoc);
        }}>
        {children}
      </Text>
    );
  }
}
