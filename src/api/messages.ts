import { supabase } from '@/services/supabase';

export async function generateFirstMessage(
  senderId: string,
  recipientId: string
) {
  try {
    const { data, error } = await supabase.functions.invoke(
      'generate-first-message',
      { body: { senderId, recipientId } }
    );

    if (error) {
      throw new Error(error.message || 'Failed to generate first message');
    }

    if (!data?.message) {
      throw new Error('Unexpected response from generate-first-message');
    }

    return data.message;
  } catch (e) {
    console.error('generateFirstMessage error:', e);
    throw e;
  }
}