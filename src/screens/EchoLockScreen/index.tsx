import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Define the stack parameter list
export type RootStackParamList = {
  Record: undefined;
  EchoLock: {
    recordingUri: string;
  };
  Vault: undefined;
};

// Type for navigation prop
type EchoLockScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EchoLock'>;

// Type for route prop
type EchoLockScreenRouteProp = RouteProp<RootStackParamList, 'EchoLock'>;

// Props type for EchoLockScreen
type Props = {
  navigation: EchoLockScreenNavigationProp;
  route: EchoLockScreenRouteProp;
};

// Interface for unlock options
interface UnlockOption {
  id: string;
  label: string;
  days: number | null; // null for random
  isRandom?: boolean;
}

const EchoLockScreen: React.FC<Props> = ({ navigation, route }) => {
  const { recordingUri } = route.params;
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Unlock options
  const unlockOptions: UnlockOption[] = [
    { id: '1day', label: 'Unlock in 1 day', days: 1 },
    { id: '7days', label: 'Unlock in 7 days', days: 7 },
    { id: '30days', label: 'Unlock in 30 days', days: 30 },
    { id: 'random', label: 'Random unlock between 1–30 days', days: null, isRandom: true },
  ];

  // Calculate unlock date based on selected option
  const calculateUnlockDate = (option: UnlockOption): Date => {
    const now = new Date();
    let daysToAdd: number;
    
    if (option.isRandom) {
      // Random between 1 and 30 days
      daysToAdd = Math.floor(Math.random() * 30) + 1;
    } else {
      daysToAdd = option.days || 0;
    }
    
    const unlockDate = new Date(now);
    unlockDate.setDate(unlockDate.getDate() + daysToAdd);
    return unlockDate;
  };

  // Handle option selection
  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  // Handle confirm button press
  const handleConfirm = () => {
    if (!selectedOption) {
      Alert.alert('Selection required', 'Please select when you want this Echo to be available.');
      return;
    }

    const selectedOptionObj = unlockOptions.find(option => option.id === selectedOption);
    
    if (selectedOptionObj) {
      const unlockDate = calculateUnlockDate(selectedOptionObj);
      
      // Here you would typically save this data to your storage or state management
      const echoData = {
        recordingUri,
        unlockAt: unlockDate.toISOString(),
        createdAt: new Date().toISOString(),
        lockOption: selectedOptionObj.id,
      };
      
      console.log('Echo data saved:', echoData);
      
      // Show success message and navigate to Vault
      Alert.alert(
        'Echo Locked Away',
        `Your voice note will be available ${selectedOptionObj.isRandom 
          ? 'on a random day within the next month' 
          : `in ${selectedOptionObj.days} day${selectedOptionObj.days !== 1 ? 's' : ''}`}`,
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Vault')
          }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>When should this Echo be available?</Text>
      
      {/* Unlock options */}
      <View style={styles.optionsContainer}>
        {unlockOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionButton,
              selectedOption === option.id && styles.selectedOption
            ]}
            onPress={() => handleOptionSelect(option.id)}
          >
            <Text 
              style={[
                styles.optionText,
                selectedOption === option.id && styles.selectedOptionText
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Confirm button */}
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleConfirm}
      >
        <Text style={styles.confirmButtonText}>Lock It Away</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    marginBottom: 40,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  selectedOption: {
    borderColor: '#0066CC',
    backgroundColor: '#E6F0FF',
  },
  optionText: {
    fontSize: 16,
    color: '#333333',
  },
  selectedOptionText: {
    color: '#0066CC',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EchoLockScreen;