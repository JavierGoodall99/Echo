import { EchoRecord } from '../lib/supabase';

// Define types for each stack navigator
export type RootStackParamList = {
  Record: undefined;
  EchoLock: { recordingUri: string };
  VaultMain: undefined;
  PlaybackScreen: { echo?: EchoRecord; echoId?: string };
  Insights: undefined;
};

// Define types for tab navigation
export type TabParamList = {
  HomeTab: undefined;
  VaultTab: {
    screen?: 'PlaybackScreen';
    params?: { echoId?: string };
  };
  Insights: undefined;
};