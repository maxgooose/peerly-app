import React from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NestMember } from '@/types/chat';
import { NestMemberItem } from './NestMemberItem';
import { leaveNest, deleteNest } from '@/services/nests';

interface NestMembersModalProps {
  visible: boolean;
  onClose: () => void;
  members: NestMember[];
  nestId: string;
  nestName: string;
  isCreator: boolean;
  onNestDeleted?: () => void;
  onMemberLeft?: () => void;
}

export function NestMembersModal({
  visible,
  onClose,
  members,
  nestId,
  nestName,
  isCreator,
  onNestDeleted,
  onMemberLeft,
}: NestMembersModalProps) {
  const handleLeaveNest = () => {
    Alert.alert(
      'Leave Nest',
      `Are you sure you want to leave "${nestName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveNest(nestId);
              onMemberLeft?.();
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to leave nest. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteNest = () => {
    Alert.alert(
      'Delete Nest',
      `Are you sure you want to delete "${nestName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNest(nestId);
              onNestDeleted?.();
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete nest. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderMember = ({ item }: { item: NestMember }) => (
    <NestMemberItem member={item} />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Members</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.nestInfo}>
          <Text style={styles.nestName}>{nestName}</Text>
          <Text style={styles.memberCount}>{members.length} members</Text>
        </View>

        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={(item) => item.id}
          style={styles.memberList}
        />

        <View style={styles.actions}>
          {isCreator ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDeleteNest}
            >
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete Nest</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.leaveButton]}
              onPress={handleLeaveNest}
            >
              <Ionicons name="exit" size={20} color="#FF3B30" />
              <Text style={styles.leaveButtonText}>Leave Nest</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 32,
  },
  nestInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  nestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  memberList: {
    flex: 1,
  },
  actions: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  leaveButton: {
    backgroundColor: '#FF3B3010',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});
