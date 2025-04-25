import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase, EchoRecord } from '../../lib/supabase';
import { ANONYMOUS_USER_ID } from '../../lib/constants';
import { RootStackParamList } from '../../types/navigation';

type VaultScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const VaultScreen: React.FC = () => {
  const navigation = useNavigation<VaultScreenNavigationProp>();
  const [echoes, setEchoes] = useState<EchoRecord[]>([]);
  const [lockedEchoes, setLockedEchoes] = useState<EchoRecord[]>([]);
  const [availableEchoes, setAvailableEchoes] = useState<EchoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch echoes directly from Supabase
  const fetchEchoes = async () => {
    try {
      setLoading(true);
      
      // First try to get data from Supabase
      const { data, error } = await supabase
        .from('echoes')
        .select('*')
        .eq('user_id', ANONYMOUS_USER_ID)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching from Supabase:', error);
        
        // Fallback to local storage if Supabase fetch fails
        const localData = await getLocalEchoes();
        processEchoData(localData);
      } else if (data && data.length > 0) {
        processEchoData(data);
      } else {
        // If no data from Supabase, try local storage
        const localData = await getLocalEchoes();
        processEchoData(localData);
      }
    } catch (error) {
      console.error('Error fetching echoes:', error);
      Alert.alert('Error', 'Failed to load your Echoes.');
    } finally {
      setLoading(false);
    }
  };
  
  // Get echoes from local storage as fallback
  const getLocalEchoes = async () => {
    // Use the existing function from lib/supabase.ts
    const { getEchoes } = require('../../lib/supabase');
    return await getEchoes(ANONYMOUS_USER_ID);
  };
  
  // Process and categorize echo data
  const processEchoData = (data: EchoRecord[]) => {
    if (data && data.length > 0) {
      setEchoes(data);
      
      // Separate echoes into available and locked based on unlock_at date
      const now = new Date();
      const available: EchoRecord[] = [];
      const locked: EchoRecord[] = [];
      
      data.forEach((echo) => {
        const unlockDate = new Date(echo.unlock_at);
        if (unlockDate <= now) {
          available.push(echo);
        } else {
          locked.push(echo);
        }
      });
      
      setAvailableEchoes(available);
      setLockedEchoes(locked);
    } else {
      setEchoes([]);
      setAvailableEchoes([]);
      setLockedEchoes([]);
    }
  };
  
  // Load echoes when the screen mounts
  useEffect(() => {
    fetchEchoes();
    
    // Refresh echoes when the screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchEchoes();
    });
    
    return unsubscribe;
  }, [navigation]);
  
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

  // Navigate to PlaybackScreen with echo data
  const navigateToPlayback = (echo: EchoRecord) => {
    navigation.navigate('PlaybackScreen', { echo });
  };
  
  // Render an available echo item
  const renderAvailableEchoItem = ({ item }: { item: EchoRecord }) => (
    <TouchableOpacity 
      style={styles.echoItem}
      onPress={() => navigateToPlayback(item)}
    >
      <View style={styles.echoContent}>
        <Text style={styles.echoDate}>
          {formatDate(item.created_at ?? new Date().toISOString())}
        </Text>
        {item.mood_tag && (
          <Text style={styles.moodTag}>
            {item.mood_tag}
          </Text>
        )}
        <Text style={styles.echoSubtitle}>
          Tap to listen
        </Text>
      </View>
      <View style={styles.playButton}>
        <Text style={styles.playButtonText}>▶</Text>
      </View>
    </TouchableOpacity>
  );
  
  // Render a locked echo item
  const renderLockedEchoItem = ({ item }: { item: EchoRecord }) => (
    <View style={[styles.echoItem, styles.lockedEchoItem]}>
      <View style={styles.echoContent}>
        <Text style={styles.echoDate}>
          {formatDate(item.created_at ?? new Date().toISOString())}
        </Text>
        <Text style={styles.echoSubtitle}>
          Available in {getTimeUntilUnlock(item.unlock_at)}
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
      
      {echoes.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No echoes yet. Speak your first memory!</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('Record' as never)}
          >
            <Text style={styles.createButtonText}>Record an Echo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Available Echoes Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Available Echoes</Text>
            {availableEchoes.length > 0 ? (
              <FlatList
                data={availableEchoes}
                renderItem={renderAvailableEchoItem}
                keyExtractor={item => item.id || item.created_at || String(Math.random())}
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
                keyExtractor={item => item.id || item.created_at || String(Math.random())}
                style={styles.echoList}
              />
            ) : (
              <Text style={styles.emptyText}>No locked echoes</Text>
            )}
          </View>
        </>
      )}
      
      {/* Refresh button */}
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
    opacity: 0.8,
  },
  echoContent: {
    flex: 1,
  },
  echoDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  moodTag: {
    fontSize: 14,
    color: '#0066CC',
    marginBottom: 4,
  },
  echoSubtitle: {
    color: '#666',
    fontSize: 14,
  },
  playButton: {
    backgroundColor: '#0066CC',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#0066CC',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default VaultScreen;
