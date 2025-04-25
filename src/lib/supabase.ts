import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system'
import { ANONYMOUS_USER_ID } from './constants'

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)

// Local storage directory for recordings
const AUDIO_DIRECTORY = FileSystem.documentDirectory + 'audio/';
// Local storage key for database records
const LOCAL_DB_KEY = 'echo_local_database';

// Types for database tables
export interface EchoRecord {
  id?: string;
  user_id: string;
  audio_url: string;
  created_at?: string;
  unlock_at: string;
  mood_tag?: string;
}

// Helper function to ensure the audio directory exists
async function ensureDirectoryExists() {
  const dirInfo = await FileSystem.getInfoAsync(AUDIO_DIRECTORY);
  if (!dirInfo.exists) {
    console.log('Creating audio directory');
    await FileSystem.makeDirectoryAsync(AUDIO_DIRECTORY, { intermediates: true });
  }
}

// Helper function to generate a UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to get records from local storage
async function getLocalRecords(): Promise<EchoRecord[]> {
  try {
    const recordsJson = await AsyncStorage.getItem(LOCAL_DB_KEY);
    if (recordsJson) {
      return JSON.parse(recordsJson);
    }
  } catch (e) {
    console.error('Error reading local records:', e);
  }
  return [];
}

// Helper function to save records to local storage
async function saveLocalRecords(records: EchoRecord[]) {
  try {
    await AsyncStorage.setItem(LOCAL_DB_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving local records:', e);
  }
}

// Helper function to upload audio file (saves locally)
export const uploadAudio = async (uri: string, fileName: string): Promise<string | null> => {
  try {
    console.log(`Starting file processing for: ${fileName} from URI: ${uri}`);
    
    // Get file info to validate the file exists
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error(`File does not exist at path: ${uri}`);
      }
      console.log(`File exists: true, Size: ${fileInfo.size} bytes`);
    } catch (error) {
      console.error('Error checking file info:', error);
      throw error;
    }

    // Make sure our audio directory exists
    await ensureDirectoryExists();
    
    // Destination path for the copied file
    const destination = AUDIO_DIRECTORY + fileName;
    
    // Copy the recording to our app's documents directory
    await FileSystem.copyAsync({
      from: uri,
      to: destination
    });
    
    console.log(`File copied successfully to ${destination}`);
    
    // Return the local file path
    return destination;
  } catch (e) {
    console.error('Error in file processing:', e);
    return null;
  }
};

// Helper function to save echo record to local storage
export const saveEchoRecord = async (record: EchoRecord): Promise<boolean> => {
  try {
    console.log('Saving echo record to local storage');
    
    // Get existing records
    const records = await getLocalRecords();
    
    // Add ID and creation date if not provided
    const newRecord = {
      ...record,
      id: record.id || generateUUID(),
      created_at: record.created_at || new Date().toISOString()
    };
    
    // Add to records list
    records.push(newRecord);
    
    // Save updated records
    await saveLocalRecords(records);
    
    console.log('Echo record saved successfully to local storage');
    return true;
  } catch (e) {
    console.error('Error saving to local storage:', e);
    return false;
  }
};

// Helper function to get echoes for a user
export const getEchoes = async (userId: string = ANONYMOUS_USER_ID): Promise<EchoRecord[]> => {
  try {
    console.log(`Getting echoes for user ${userId} from local storage`);
    
    // Get all records
    const records = await getLocalRecords();
    
    // Filter for the specific user
    const userRecords = records.filter(record => record.user_id === userId);
    
    // Sort by created_at descending (newest first)
    userRecords.sort((a, b) => {
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    });
    
    console.log(`Found ${userRecords.length} echoes for user ${userId}`);
    return userRecords;
  } catch (e) {
    console.error('Error getting echoes from local storage:', e);
    return [];
  }
};