import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const InsightsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Insights Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default InsightsScreen;
