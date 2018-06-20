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
