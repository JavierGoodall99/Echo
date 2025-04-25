import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { EchoRecord } from '../../lib/supabase';
import { getEchoes } from '../../lib/supabase';

// Define the navigation param list including PlaybackScreen
type RootStackParamList = {
  Record: undefined;
  EchoLock: { recordingUri: string };
  Vault: undefined;
  PlaybackScreen: { echo?: EchoRecord; echoId?: string };
};

// Types for navigation and route props
type PlaybackScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PlaybackScreen'>;
type PlaybackScreenRouteProp = RouteProp<RootStackParamList, 'PlaybackScreen'>;

type Props = {
  navigation: PlaybackScreenNavigationProp;
  route: PlaybackScreenRouteProp;
};

const PlaybackScreen: React.FC<Props> = ({ navigation, route }) => {
  const { echo: initialEcho, echoId } = route.params;
  const [echo, setEcho] = useState<EchoRecord | undefined>(initialEcho);
  
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState<number | null>(null);
  const [position, setPosition] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [showResponseCTA, setShowResponseCTA] = useState(false);

  // Load echo data if we only have an ID
  useEffect(() => {
    async function loadEchoData() {
      if (!echo && echoId) {
        const echoes = await getEchoes();
        const foundEcho = echoes.find(e => e.id === echoId);
        
        if (foundEcho) {
          // Check if echo is unlocked
          const unlockDate = new Date(foundEcho.unlock_at);
          const now = new Date();
          
          if (unlockDate > now) {
            Alert.alert(
              'Echo Not Available',
              'This echo is still locked and will be available at the scheduled time.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
            return;
          }
          
          setEcho(foundEcho);
        } else {
          Alert.alert(
            'Echo Not Found',
            'The requested echo could not be found.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      }
    }
    
    loadEchoData();
  }, [echoId, echo, navigation]);

  // Only proceed with audio loading if we have echo data
  useEffect(() => {
    if (!echo) return;
    
    let isMounted = true;
    
    async function loadSound() {
      try {
        setLoading(true);
        setShowResponseCTA(false);
        
        // Check if the file exists
        const fileInfo = await FileSystem.getInfoAsync(echo!.audio_url);
        
        if (!fileInfo.exists) {
          setError('Audio file not found. It may have been deleted or moved.');
          setLoading(false);
          return;
        }
        
        console.log(`Loading audio from: ${echo!.audio_url}`);
        
        // Create sound object
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: echo!.audio_url },
          { shouldPlay: false },
          onPlaybackStatusUpdate
        );
        
        if (isMounted) {
          setSound(newSound);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading sound:', err);
        if (isMounted) {
          setError('Failed to load audio. Please try again later.');
          setLoading(false);
        }
      }
    }
    
    loadSound();
    
    // Cleanup function to unload sound when component unmounts
    return () => {
      isMounted = false;
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [echo?.audio_url]);

  // Handle playback status updates
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      if (status.durationMillis) {
        setDuration(status.durationMillis);
      }
      setIsPlaying(status.isPlaying);
      
      if (status.didJustFinish) {
        // Show response CTA when playback finishes
        setShowResponseCTA(true);
        // Reset position when playback finishes
        sound?.setPositionAsync(0);
      }
    }
  };

  // Handle "Respond to yourself?" button press
  const handleRespond = () => {
    navigation.navigate('Record');
  };

  // Toggle play/pause
  const togglePlayback = async () => {
    if (!sound) return;
    
    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (err) {
      console.error('Error toggling playback:', err);
      Alert.alert('Playback Error', 'There was an issue with audio playback.');
    }
  };

  // Format milliseconds to mm:ss
  const formatTime = (millis: number | null): string => {
    if (millis === null) return '00:00';
    
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Only render content if we have echo data */}
      {echo ? (
        <>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Echo Playback</Text>
          </View>
          
          <View style={styles.content}>
            <View style={styles.echoCard}>
              <Text style={styles.dateText}>
                {formatDate(echo.created_at)}
              </Text>
              
              <View style={styles.tagContainer}>
                <Text style={styles.moodTag}>
                  {echo.mood_tag || "Unknown Mood"}
                </Text>
              </View>
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#0066CC" />
                  <Text style={styles.loadingText}>Loading audio...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : (
                <View style={styles.playerContainer}>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{formatTime(position)}</Text>
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                  </View>
                  
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: duration ? `${(position / duration) * 100}%` : '0%'
                        }
                      ]} 
                    />
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.playPauseButton}
                    onPress={togglePlayback}
                  >
                    <Text style={styles.playPauseText}>
                      {isPlaying ? '❚❚' : '▶'}
                    </Text>
                  </TouchableOpacity>

                  {showResponseCTA && (
                    <TouchableOpacity 
                      style={styles.respondButton}
                      onPress={handleRespond}
                    >
                      <Text style={styles.respondButtonText}>
                        Respond to yourself?
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Loading echo...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0066CC',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 32, // To center the title considering the back button
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  echoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  tagContainer: {
    marginBottom: 16,
  },
  moodTag: {
    fontSize: 16,
    color: '#0066CC',
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
  },
  playerContainer: {
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeText: {
    color: '#666',
    fontSize: 14,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066CC',
  },
  playPauseButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  playPauseText: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
  },
  respondButton: {
    marginTop: 30,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#0066CC',
  },
  respondButtonText: {
    color: '#0066CC',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default PlaybackScreen;