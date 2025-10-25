import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { NestMember } from '@/types/chat';

interface NestMemberItemProps {
  member: NestMember;
}

export function NestMemberItem({ member }: NestMemberItemProps) {
  return (
    <View style={styles.container}>
      <Image
        source={{ 
          uri: member.user.profile_photo_url || 'https://via.placeholder.com/40' 
        }}
        style={styles.avatar}
      />
      
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{member.user.full_name || 'Unknown User'}</Text>
          {member.role === 'creator' && (
            <View style={styles.creatorBadge}>
              <Text style={styles.creatorText}>Creator</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.joinedDate}>
          Joined {new Date(member.joined_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  creatorBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  creatorText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  joinedDate: {
    fontSize: 13,
    color: '#8E8E93',
  },
});
