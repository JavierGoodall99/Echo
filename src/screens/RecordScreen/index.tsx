import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';

const RecordScreen: React.FC = () => {
  // State variables
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  // Request microphone permissions on component mount
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setPermissionGranted(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'This app needs access to your microphone to record audio.',
          [{ text: 'OK' }]
        );
      }
    })();
  }, []);

  // Timer effect for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (!isRecording && recordingTime !== 0) {
      setRecordingTime(0);
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Format time to mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording function
  const startRecording = async () => {
    try {
      // Request permission if not already granted
      if (!permissionGranted) {
        const { status } = await Audio.requestPermissionsAsync();
        setPermissionGranted(status === 'granted');
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission required',
            'This app needs access to your microphone to record audio.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // Prepare and configure recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  // Stop recording function
  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
      setIsRecording(false);
      
      // Request media library permissions to save the recording
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted' && uri) {
        // Save recording to media library (optional)
        // await MediaLibrary.createAssetAsync(uri);
      }
      
      // Show confirmation
      Alert.alert(
        'Recording Saved',
        'Your voice note has been recorded successfully!',
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View style={styles.container}>
      {/* Recording timer */}
      <Text style={styles.timerText}>
        {isRecording ? formatTime(recordingTime) : '00:00'}
      </Text>
      
      {/* Record/Stop button */}
      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording ? styles.stopButton : styles.startButton
        ]}
        onPress={toggleRecording}
      >
        <Text style={styles.buttonText}>
          {isRecording ? 'STOP' : 'RECORD'}
        </Text>
      </TouchableOpacity>
      
      {/* Recording status */}
      {recordingUri && !isRecording && (
        <Text style={styles.statusText}>Voice note recorded successfully!</Text>
      )}
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
  recordButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  startButton: {
    backgroundColor: '#0066CC',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerText: {
    fontSize: 48,
    marginBottom: 40,
    fontWeight: '200',
  },
  statusText: {
    marginTop: 30,
    fontSize: 16,
    color: 'green',
  },
});

export default RecordScreen;
