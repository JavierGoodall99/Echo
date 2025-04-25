import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { supabase } from '../../lib/supabase';
import { ANONYMOUS_USER_ID } from '../../lib/constants';
import type { EchoRecord } from '../../lib/supabase';

const InsightsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [echoes, setEchoes] = useState<EchoRecord[]>([]);
  const [stats, setStats] = useState({
    totalEchoes: 0,
    avgUnlockTime: 0,
    commonMoodTag: '',
    weeklyData: {
      labels: [] as string[],
      datasets: [{ data: [] as number[] }],
    },
  });

  useEffect(() => {
    fetchEchoes();
  }, []);

  const fetchEchoes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('echoes')
        .select('*')
        .eq('user_id', ANONYMOUS_USER_ID)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (data) {
        setEchoes(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error('Error fetching echoes:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: EchoRecord[]) => {
    // Calculate total echoes
    const totalEchoes = data.length;

    // Calculate average unlock time
    const unlockTimes = data.map(echo => {
      const createdAt = new Date(echo.created_at || '');
      const unlockAt = new Date(echo.unlock_at);
      return Math.round((unlockAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    });
    const avgUnlockTime = unlockTimes.length 
      ? Math.round(unlockTimes.reduce((a, b) => a + b, 0) / unlockTimes.length) 
      : 0;

    // Find most common mood tag
    const moodTags = data
      .map(echo => echo.mood_tag)
      .filter(tag => tag) as string[];
    const moodCount: { [key: string]: number } = {};
    let commonMoodTag = '';
    let maxCount = 0;

    moodTags.forEach(tag => {
      moodCount[tag] = (moodCount[tag] || 0) + 1;
      if (moodCount[tag] > maxCount) {
        maxCount = moodCount[tag];
        commonMoodTag = tag;
      }
    });

    // Calculate weekly data
    const weeklyData = calculateWeeklyData(data);

    setStats({
      totalEchoes,
      avgUnlockTime,
      commonMoodTag,
      weeklyData,
    });
  };

  const calculateWeeklyData = (data: EchoRecord[]) => {
    const weeks: { [key: string]: number } = {};
    const now = new Date();
    const sixWeeksAgo = new Date(now.getTime() - (42 * 24 * 60 * 60 * 1000));

    // Initialize last 6 weeks
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      const weekKey = date.toISOString().slice(5, 10);
      weeks[weekKey] = 0;
    }

    // Count echoes per week
    data.forEach(echo => {
      const createdAt = new Date(echo.created_at || '');
      if (createdAt >= sixWeeksAgo) {
        const weekKey = createdAt.toISOString().slice(5, 10);
        weeks[weekKey] = (weeks[weekKey] || 0) + 1;
      }
    });

    return {
      labels: Object.keys(weeks).reverse(),
      datasets: [{ data: Object.values(weeks).reverse() }],
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Analyzing your reflection journey...</Text>
      </View>
    );
  }

  if (echoes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Your journey begins here</Text>
        <Text style={styles.emptyText}>
          Your reflections will tell their story soon.
          Each echo you record adds a new chapter to your personal narrative.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Reflection Journey</Text>
      
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalEchoes}</Text>
          <Text style={styles.statLabel}>Total Echoes</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.avgUnlockTime}</Text>
          <Text style={styles.statLabel}>Avg Days to Unlock</Text>
        </View>
      </View>

      {stats.commonMoodTag && (
        <View style={styles.moodCard}>
          <Text style={styles.moodTitle}>Most Common Mood</Text>
          <Text style={styles.moodTag}>{stats.commonMoodTag}</Text>
        </View>
      )}

      {/* Activity Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Echo Activity</Text>
        <LineChart
          data={stats.weeklyData}
          width={Dimensions.get('window').width - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 102, 204, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <Text style={styles.inspirationalText}>
        You're building a powerful conversation with yourself.
        Each reflection adds depth to your story.
      </Text>
    </ScrollView>
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
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  moodCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  moodTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  moodTag: {
    fontSize: 24,
    color: '#0066CC',
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
  },
  inspirationalText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F5FCFF',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default InsightsScreen;
