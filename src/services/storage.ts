import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const PROFILE_PHOTOS_BUCKET = 'profile-photos';

export interface UploadPhotoResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Uploads a profile photo to Supabase Storage
 * @param uri - Local file URI from ImagePicker
 * @param userId - User ID to use in file naming
 * @returns Object with success status, public URL, or error message
 */
export async function uploadProfilePhoto(
  uri: string,
  userId: string
): Promise<UploadPhotoResult> {
  try {
    // 1. Read the file as base64
    const base64 = await (FileSystem as any).readAsStringAsync(uri, {
      encoding: 'base64',
    });

    // 2. Determine file extension from URI
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const contentType = getContentType(ext);

    // 3. Generate unique filename
    // Safwan's migration expects: {userId}/filename
    const fileName = `avatar-${Date.now()}.${ext}`;
    const filePath = `${userId}/${fileName}`;

    // 4. Convert base64 to ArrayBuffer for upload
    const arrayBuffer = decode(base64);

    // 5. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: 'Failed to upload photo. Please try again.',
      };
    }

    // 6. Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrlData.publicUrl,
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while uploading your photo.',
    };
  }
}

/**
 * Deletes a profile photo from Supabase Storage
 * @param photoUrl - Public URL of the photo to delete
 * @returns Success status
 */
export async function deleteProfilePhoto(photoUrl: string): Promise<boolean> {
  try {
    // Extract file path from public URL
    const urlParts = photoUrl.split(`${PROFILE_PHOTOS_BUCKET}/`);
    if (urlParts.length < 2) {
      console.error('Invalid photo URL format');
      return false;
    }

    const filePath = urlParts[1];

    // Delete from storage
    const { error } = await supabase.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
}

/**
 * Updates user's profile photo URL in the database
 * @param userId - User ID
 * @param photoUrl - New photo URL
 * @returns Success status
 */
export async function updateUserProfilePhotoUrl(
  userId: string,
  photoUrl: string | null
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('users')
    .update({ profile_photo_url: photoUrl })
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile photo URL:', error);
    return {
      success: false,
      error: 'Failed to update profile photo.',
    };
  }

  return { success: true };
}

/**
 * Helper function to determine content type from file extension
 */
function getContentType(extension: string): string {
  const types: { [key: string]: string } = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };

  return types[extension] || 'image/jpeg';
}
