import { supabase } from '@/services/supabase';

export async function generateFirstMessage(
  senderId: string,
  recipientId: string
) {
  const { data, error } = await supabase.functions.invoke(
    'generate-first-message',
    { body: { senderId, recipientId } }
  );

  if (error) throw error;
  return data.message;
}