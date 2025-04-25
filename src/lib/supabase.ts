import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

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

// Storage bucket name for voice recordings
export const STORAGE_BUCKET = 'echo-audio'

// Types for database tables
export interface EchoRecord {
  id?: string;
  user_id: string;
  audio_url: string;
  created_at?: string;
  unlock_at: string;
  mood_tag?: string;
}

// Helper function to upload audio file to Supabase storage
export const uploadAudio = async (uri: string, fileName: string): Promise<string | null> => {
  try {
    // Convert the local file URI to blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .upload(`recordings/${fileName}`, blob, {
        contentType: 'audio/mpeg',
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading audio:', error);
      return null;
    }
    
    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(`recordings/${fileName}`);
    
    return publicUrl;
  } catch (e) {
    console.error('Error in upload process:', e);
    return null;
  }
};

// Helper function to save echo record to database
export const saveEchoRecord = async (record: EchoRecord): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('echoes')
      .insert([record]);
    
    if (error) {
      console.error('Error saving echo record:', error);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Error in database operation:', e);
    return false;
  }
};