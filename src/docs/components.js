import React from 'react';
import { View, Text, ScrollView } from 'react-native';

import linkContext from './linkContext';

export const DocPage = ({ children, title }) => (
  <ScrollView contentContainerStyle={{ padding: 50 }}>
    <View>
      {title && <Text style={{ fontSize: 84 }}>{title}</Text>}
      {children}
    </View>
  </ScrollView>
);
export const P = ({ children }) => (
  <Text style={{ marginVertical: 15 }}>{children}</Text>
);
export const List = ({ items }) => (
  <View style={{ marginLeft: 20 }}>{items}</View>
);

export const SubTitle = ({ children }) => (
  <Text style={{ marginTop: 60, marginBottom: 20, fontSize: 42 }}>
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
    const { Consumer } = linkContext;
    const { toDoc, children } = this.props;
    console.log('render link wtf', toDoc, children);
    return (
      <Consumer
        children={handleLink => (
          <Text style={{ color: '#228' }} onPress={() => handleLink(toDoc)}>
            {children}
          </Text>
        )}
      />
    );
  }
}
