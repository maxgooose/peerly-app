import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { searchNests, getSuggestedNests, joinNest, isUserMemberOfNest } from '@/services/nests';
import { NestCard } from '@/components/nest/NestCard';
import type { NestWithMembers } from '@/types/chat';

const SUBJECTS = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Engineering',
  'Psychology',
  'Economics',
  'Literature',
  'History',
  'Art',
  'Music',
  'Business',
  'Medicine',
  'Law',
  'Education',
  'Other',
];

export default function DiscoverNestsScreen() {
  const router = useRouter();
  
  const [suggestedNests, setSuggestedNests] = useState<NestWithMembers[]>([]);
  const [allNests, setAllNests] = useState<NestWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [joiningNest, setJoiningNest] = useState<string | null>(null);

  useEffect(() => {
    loadNests();
  }, []);

  useEffect(() => {
    if (searchQuery || selectedSubject) {
      searchNestsDebounced();
    } else {
      loadAllNests();
    }
  }, [searchQuery, selectedSubject]);

  const loadNests = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSuggestedNests(),
        loadAllNests(),
      ]);
    } catch (error) {
      console.error('Error loading nests:', error);
      Alert.alert('Error', 'Failed to load nests.');
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestedNests = async () => {
    try {
      const nests = await getSuggestedNests();
      setSuggestedNests(nests);
    } catch (error) {
      console.error('Error loading suggested nests:', error);
    }
  };

  const loadAllNests = async () => {
    try {
      const nests = await searchNests({ limit: 50 });
      setAllNests(nests);
    } catch (error) {
      console.error('Error loading all nests:', error);
    }
  };

  const searchNestsDebounced = async () => {
    try {
      const nests = await searchNests({
        subject: selectedSubject || undefined,
        search: searchQuery || undefined,
        limit: 50,
      });
      setAllNests(nests);
    } catch (error) {
      console.error('Error searching nests:', error);
    }
  };

  const handleJoinNest = async (nestId: string) => {
    try {
      setJoiningNest(nestId);
      
      // Check if already a member
      const isMember = await isUserMemberOfNest(nestId);
      if (isMember) {
        Alert.alert('Already a Member', 'You are already a member of this nest.');
        return;
      }

      await joinNest({ nestId });
      
      Alert.alert(
        'Success',
        'You have joined the nest!',
        [
          {
            text: 'OK',
            onPress: () => router.push(`/nest/${nestId}`),
          },
        ]
      );
    } catch (error) {
      console.error('Error joining nest:', error);
      Alert.alert('Error', 'Failed to join nest. Please try again.');
    } finally {
      setJoiningNest(null);
    }
  };

  const renderNestCard = ({ item }: { item: NestWithMembers }) => {
    const isJoining = joiningNest === item.id;
    const isFull = item.member_count >= item.member_limit;
    
    return (
      <NestCard
        nest={item}
        onPress={() => {
          if (isJoining) return;
          handleJoinNest(item.id);
        }}
        lastMessage={undefined} // TODO: Add last message support
      />
    );
  };

  const renderSubjectFilter = (subject: string) => {
    const isSelected = selectedSubject === subject;
    
    return (
      <TouchableOpacity
        key={subject}
        style={[
          styles.subjectFilter,
          isSelected && styles.selectedSubjectFilter,
        ]}
        onPress={() => setSelectedSubject(isSelected ? '' : subject)}
      >
        <Text
          style={[
            styles.subjectFilterText,
            isSelected && styles.selectedSubjectFilterText,
          ]}
        >
          {subject}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSuggestedSection = () => {
    if (suggestedNests.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Suggested for You</Text>
        <FlatList
          data={suggestedNests}
          renderItem={renderNestCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>
    );
  };

  const renderAllNestsSection = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {searchQuery || selectedSubject ? 'Search Results' : 'All Nests'}
        </Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading nests...</Text>
          </View>
        ) : allNests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color="#8E8E93" />
            <Text style={styles.emptyText}>No nests found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or create a new nest
            </Text>
          </View>
        ) : (
          <FlatList
            data={allNests}
            renderItem={renderNestCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Discover Nests</Text>
        <TouchableOpacity onPress={() => router.push('/nest/create')}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search nests..."
            placeholderTextColor="#8E8E93"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Subject Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {SUBJECTS.map(renderSubjectFilter)}
        </ScrollView>
      </View>

      {/* Content */}
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <>
            {renderSuggestedSection()}
            {renderAllNestsSection()}
          </>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      />
    </View>
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
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    marginLeft: 8,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filtersContent: {
    paddingHorizontal: 16,
  },
  subjectFilter: {
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectedSubjectFilter: {
    backgroundColor: '#007AFF',
  },
  subjectFilterText: {
    fontSize: 14,
    color: '#000',
  },
  selectedSubjectFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
  },
});
