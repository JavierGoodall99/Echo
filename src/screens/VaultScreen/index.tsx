import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { supabase } from '../../lib/supabase';

interface Echo {
  id: string;
  user_id: string;
  audio_url: string;
  created_at: string;
  unlock_at: string;
  mood_tag?: string;
}

const VaultScreen: React.FC = () => {
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [lockedEchoes, setLockedEchoes] = useState<Echo[]>([]);
  const [availableEchoes, setAvailableEchoes] = useState<Echo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  // Fetch echoes from Supabase
  const fetchEchoes = async () => {
    try {
      setLoading(true);
      
      // For now, we're using a fixed user_id
      // This should be replaced with the authenticated user's ID once auth is implemented
      const { data, error } = await supabase
        .from('echoes')
        .select('*')
        .eq('user_id', 'anonymous_user')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setEchoes(data as Echo[]);
        
        // Separate echoes into available and locked based on unlock_at date
        const now = new Date();
        const available: Echo[] = [];
        const locked: Echo[] = [];
        
        data.forEach((echo: Echo) => {
          const unlockDate = new Date(echo.unlock_at);
          if (unlockDate <= now) {
            available.push(echo);
          } else {
            locked.push(echo);
          }
        });
        
        setAvailableEchoes(available);
        setLockedEchoes(locked);
      }
    } catch (error) {
      console.error('Error fetching echoes:', error);
      Alert.alert('Error', 'Failed to load your Echoes.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load echoes when the screen mounts
  useEffect(() => {
    fetchEchoes();
    
    // Clean up sound on component unmount
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);
  
  // Format date display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Calculate time until unlock
  const getTimeUntilUnlock = (unlockAtString: string): string => {
    const now = new Date();
    const unlockAt = new Date(unlockAtString);
    const diffTime = Math.abs(unlockAt.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) {
      return `${diffDays} days`;
    } else {
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      return diffHours > 1 ? `${diffHours} hours` : 'Less than an hour';
    }
  };
  
  // Play an audio file
  const playSound = async (audioUrl: string, echoId: string) => {
    try {
      // Stop any currently playing sound
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      
      // Load and play the new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setPlayingId(echoId);
      
      // When playback finishes
      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (error) {
      console.error('Error playing sound:', error);
      Alert.alert('Playback Error', 'Could not play this recording.');
    }
  };
  
  // Render an available echo item
  const renderAvailableEchoItem = ({ item }: { item: Echo }) => (
    <TouchableOpacity 
      style={styles.echoItem}
      onPress={() => playSound(item.audio_url, item.id)}
    >
      <View style={styles.echoContent}>
        <Text style={styles.echoDate}>{formatDate(item.created_at)}</Text>
        <Text style={styles.echoSubtitle}>
          {playingId === item.id ? 'Playing...' : 'Tap to play'}
        </Text>
      </View>
      {playingId === item.id && (
        <View style={styles.playingIndicator}>
          <Text style={styles.playingText}>▶</Text>
        </View>
      )}
    </TouchableOpacity>
  );
  
  // Render a locked echo item
  const renderLockedEchoItem = ({ item }: { item: Echo }) => (
    <View style={[styles.echoItem, styles.lockedEchoItem]}>
      <View style={styles.echoContent}>
        <Text style={styles.echoDate}>{formatDate(item.created_at)}</Text>
        <Text style={styles.echoSubtitle}>
          Unlocks in {getTimeUntilUnlock(item.unlock_at)}
        </Text>
      </View>
      <View style={styles.lockIcon}>
        <Text>🔒</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading your echoes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Echo Vault</Text>
      
      {/* Available Echoes Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Available Echoes</Text>
        {availableEchoes.length > 0 ? (
          <FlatList
            data={availableEchoes}
            renderItem={renderAvailableEchoItem}
            keyExtractor={item => item.id}
            style={styles.echoList}
          />
        ) : (
          <Text style={styles.emptyText}>No available echoes yet</Text>
        )}
      </View>
      
      {/* Locked Echoes Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Locked Echoes</Text>
        {lockedEchoes.length > 0 ? (
          <FlatList
            data={lockedEchoes}
            renderItem={renderLockedEchoItem}
            keyExtractor={item => item.id}
            style={styles.echoList}
          />
        ) : (
          <Text style={styles.emptyText}>No locked echoes</Text>
        )}
      </View>
      
      {/* Pull to refresh */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={fetchEchoes}
      >
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 20,
  },
  sectionContainer: {
    marginBottom: 24,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  echoList: {
    flex: 1,
  },
  echoItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  lockedEchoItem: {
    backgroundColor: '#F0F0F0',
  },
  echoContent: {
    flex: 1,
  },
  echoDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  echoSubtitle: {
    color: '#666',
    fontSize: 14,
  },
  playingIndicator: {
    backgroundColor: '#0066CC',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingText: {
    color: 'white',
    fontWeight: 'bold',
  },
  lockIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#888',
    fontStyle: 'italic',
  },
  refreshButton: {
    backgroundColor: '#0066CC',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 16,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default VaultScreen;
