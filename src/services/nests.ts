// =====================================================
// NESTS SERVICE
// =====================================================
// Service for managing Discord-style study groups (Nests)
// Handles CRUD operations, messaging, and member management

import { supabase } from './supabase';
import type { 
  Nest, 
  NestWithMembers, 
  NestMember, 
  NestMessage, 
  NestMessageWithSender,
  CreateNestParams,
  JoinNestParams,
  SendNestMessageParams,
  SearchNestsParams
} from '@/types/chat';

/**
 * Create a new Nest (study group)
 */
export async function createNest(params: CreateNestParams): Promise<Nest | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's university
    const { data: userData } = await supabase
      .from('users')
      .select('university')
      .eq('id', user.id)
      .single();

    if (!userData?.university) {
      throw new Error('User university not found');
    }

    const { data, error } = await supabase
      .from('nests')
      .insert({
        name: params.name,
        subject: params.subject,
        class_name: params.class_name || null,
        description: params.description || null,
        university: userData.university,
        created_by: user.id,
        member_limit: params.member_limit || 6,
        is_auto_created: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating nest:', error);
      throw error;
    }

    return data as Nest;
  } catch (error) {
    console.error('createNest error:', error);
    throw error;
  }
}

/**
 * Get all Nests the current user is a member of
 */
export async function getNestsForUser(): Promise<NestWithMembers[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('nest_members')
      .select(`
        nest:nests (
          id,
          name,
          subject,
          class_name,
          description,
          university,
          created_by,
          member_limit,
          is_auto_created,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching user nests:', error);
      throw error;
    }

    // Get member counts for each nest
    const nestsWithMembers = await Promise.all(
      (data || []).map(async (item) => {
        const nest = item.nest as Nest;
        const memberCount = await getNestMemberCount(nest.id);
        const members = await getNestMembers(nest.id);
        
        return {
          ...nest,
          member_count: memberCount,
          members: members,
        } as NestWithMembers;
      })
    );

    return nestsWithMembers;
  } catch (error) {
    console.error('getNestsForUser error:', error);
    throw error;
  }
}

/**
 * Get a single Nest by ID with members
 */
export async function getNestById(nestId: string): Promise<NestWithMembers | null> {
  try {
    const { data, error } = await supabase
      .from('nests')
      .select(`
        *,
        members:nest_members (
          id,
          user_id,
          role,
          joined_at,
          user:users (
            id,
            full_name,
            profile_photo_url
          )
        )
      `)
      .eq('id', nestId)
      .single();

    if (error) {
      console.error('Error fetching nest:', error);
      return null;
    }

    return {
      ...data,
      member_count: data.members?.length || 0,
    } as NestWithMembers;
  } catch (error) {
    console.error('getNestById error:', error);
    return null;
  }
}

/**
 * Join an existing Nest
 */
export async function joinNest(params: JoinNestParams): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user is already a member
    const { data: existing } = await supabase
      .from('nest_members')
      .select('id')
      .eq('nest_id', params.nestId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      throw new Error('Already a member of this nest');
    }

    const { error } = await supabase
      .from('nest_members')
      .insert({
        nest_id: params.nestId,
        user_id: user.id,
        role: 'member',
      });

    if (error) {
      console.error('Error joining nest:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('joinNest error:', error);
    throw error;
  }
}

/**
 * Leave a Nest
 */
export async function leaveNest(nestId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('nest_members')
      .delete()
      .eq('nest_id', nestId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error leaving nest:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('leaveNest error:', error);
    throw error;
  }
}

/**
 * Delete a Nest (creator only)
 */
export async function deleteNest(nestId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('nests')
      .delete()
      .eq('id', nestId)
      .eq('created_by', user.id);

    if (error) {
      console.error('Error deleting nest:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('deleteNest error:', error);
    throw error;
  }
}

/**
 * Get messages for a Nest with pagination
 */
export async function getNestMessages(
  nestId: string,
  options?: {
    limit?: number;
    before?: string; // timestamp for cursor-based pagination
  }
): Promise<NestMessageWithSender[]> {
  try {
    const limit = options?.limit || 50;
    const before = options?.before;

    let query = supabase
      .from('nest_messages')
      .select(`
        *,
        sender:users!nest_messages_sender_id_fkey (
          id,
          full_name,
          profile_photo_url
        )
      `)
      .eq('nest_id', nestId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Add cursor-based pagination
    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching nest messages:', error);
      throw error;
    }

    // Reverse to show oldest first (chat UI convention)
    return ((data || []) as unknown as NestMessageWithSender[]).reverse();
  } catch (error) {
    console.error('getNestMessages error:', error);
    throw error;
  }
}

/**
 * Send a message to a Nest
 */
export async function sendNestMessage(params: SendNestMessageParams): Promise<NestMessage | null> {
  try {
    const { data, error } = await supabase
      .from('nest_messages')
      .insert({
        nest_id: params.nestId,
        sender_id: params.senderId,
        content: params.content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending nest message:', error);
      throw error;
    }

    return data as NestMessage;
  } catch (error) {
    console.error('sendNestMessage error:', error);
    throw error;
  }
}

/**
 * Search for Nests by filters
 */
export async function searchNests(params: SearchNestsParams): Promise<NestWithMembers[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's university
    const { data: userData } = await supabase
      .from('users')
      .select('university')
      .eq('id', user.id)
      .single();

    if (!userData?.university) {
      throw new Error('User university not found');
    }

    let query = supabase
      .from('nests')
      .select(`
        *,
        members:nest_members (
          id,
          user_id,
          role,
          joined_at,
          user:users (
            id,
            full_name,
            profile_photo_url
          )
        )
      `)
      .eq('university', userData.university) // Only show nests from same university
      .order('created_at', { ascending: false });

    // Apply filters
    if (params.subject) {
      query = query.eq('subject', params.subject);
    }

    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,class_name.ilike.%${params.search}%`);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching nests:', error);
      throw error;
    }

    // Transform to NestWithMembers format
    const nestsWithMembers = (data || []).map(nest => ({
      ...nest,
      member_count: nest.members?.length || 0,
    })) as NestWithMembers[];

    return nestsWithMembers;
  } catch (error) {
    console.error('searchNests error:', error);
    throw error;
  }
}

/**
 * Get all members of a Nest
 */
export async function getNestMembers(nestId: string): Promise<NestMember[]> {
  try {
    const { data, error } = await supabase
      .from('nest_members')
      .select(`
        id,
        nest_id,
        user_id,
        role,
        joined_at,
        user:users (
          id,
          full_name,
          profile_photo_url
        )
      `)
      .eq('nest_id', nestId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error fetching nest members:', error);
      throw error;
    }

    return (data || []) as NestMember[];
  } catch (error) {
    console.error('getNestMembers error:', error);
    throw error;
  }
}

/**
 * Get member count for a Nest
 */
export async function getNestMemberCount(nestId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('nest_members')
      .select('*', { count: 'exact', head: true })
      .eq('nest_id', nestId);

    if (error) {
      console.error('Error fetching nest member count:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('getNestMemberCount error:', error);
    return 0;
  }
}

/**
 * Check if user is a member of a Nest
 */
export async function isUserMemberOfNest(nestId: string, userId?: string): Promise<boolean> {
  try {
    const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!currentUserId) return false;

    const { data, error } = await supabase
      .from('nest_members')
      .select('id')
      .eq('nest_id', nestId)
      .eq('user_id', currentUserId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking nest membership:', error);
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('isUserMemberOfNest error:', error);
    return false;
  }
}

/**
 * Get suggested Nests for user based on their subjects
 */
export async function getSuggestedNests(): Promise<NestWithMembers[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's preferred subjects
    const { data: userData } = await supabase
      .from('users')
      .select('preferred_subjects, university')
      .eq('id', user.id)
      .single();

    if (!userData?.preferred_subjects || !userData?.university) {
      return [];
    }

    // Find nests with matching subjects that user isn't already in
    const { data, error } = await supabase
      .from('nests')
      .select(`
        *,
        members:nest_members (
          id,
          user_id,
          role,
          joined_at,
          user:users (
            id,
            full_name,
            profile_photo_url
          )
        )
      `)
      .eq('university', userData.university)
      .in('subject', userData.preferred_subjects)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching suggested nests:', error);
      throw error;
    }

    // Filter out nests user is already a member of
    const userNestIds = await getUserNestIds(user.id);
    const suggestedNests = (data || [])
      .filter(nest => !userNestIds.includes(nest.id))
      .map(nest => ({
        ...nest,
        member_count: nest.members?.length || 0,
      })) as NestWithMembers[];

    return suggestedNests;
  } catch (error) {
    console.error('getSuggestedNests error:', error);
    throw error;
  }
}

/**
 * Get user's Nest IDs for filtering
 */
async function getUserNestIds(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('nest_members')
      .select('nest_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user nest IDs:', error);
      return [];
    }

    return (data || []).map(item => item.nest_id);
  } catch (error) {
    console.error('getUserNestIds error:', error);
    return [];
  }
}
