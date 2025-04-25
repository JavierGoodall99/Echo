import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';

type RecordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Record'>;

type Props = {
  navigation: RecordScreenNavigationProp;
};

const RecordScreen: React.FC<Props> = ({ navigation }) => {
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
      
      // Custom recording options for better upload performance
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.IOSAudioQuality.MEDIUM,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };
      
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      
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
      
      if (!uri) {
        throw new Error("Recording URI is undefined");
      }
      
      console.log(`Original recording URI: ${uri}`);
      
      // Process the URI to ensure it's in a format compatible with uploads
      let processedUri = uri;
      
      // Get file info
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        console.log(`File exists: ${fileInfo.exists}${fileInfo.exists && 'size' in fileInfo ? `, Size: ${fileInfo.size} bytes` : ''}`);
        
        // If file is too large (> 5MB), alert the user
        if (fileInfo.exists && 'size' in fileInfo && fileInfo.size > 5 * 1024 * 1024) {
          Alert.alert('Warning', 'Audio file is quite large. Upload may take longer.');
        }
      } catch (error) {
        console.error('Error checking file info:', error);
      }

      // On Android, make sure the URI has the correct format
      if (Platform.OS === 'android' && !uri.startsWith('file://')) {
        processedUri = `file://${uri}`;
      }
      
      console.log(`Processed URI for upload: ${processedUri}`);
      setRecordingUri(processedUri);
      setRecording(null);
      setIsRecording(false);
      
      // Request media library permissions to save the recording
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        try {
          // Save recording to media library (optional)
          const asset = await MediaLibrary.createAssetAsync(uri);
          console.log('Saved to media library as asset:', asset);
        } catch (error) {
          console.error('Error saving to media library:', error);
        }
      }
      
      // Navigate to EchoLockScreen with the processed recording URI
      navigation.navigate('EchoLock', { recordingUri: processedUri });
      
    } catch (err) {
      console.error('Failed to stop recording:', err);
      Alert.alert('Error', 'Failed to process recording. Please try again.');
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
