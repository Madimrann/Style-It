import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../../services/api';
import { Plus } from 'lucide-react-native';
import { API_BASE_URL } from '../../utils/config';

export default function WardrobeScreen({ navigation }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadItems = async () => {
        try {
            const data = await apiService.getWardrobeItems();
            setItems(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadItems();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadItems();
    }, []);

    // Helper to resolve image URL
    // Basically, if it starts with /uploads, prepend the API base URL (minus /api)
    // Or simpler, just use the full URL if we can construct it
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        if (imagePath.startsWith('/uploads')) {
            // API_BASE_URL is http://host:5000/api
            // We want http://host:5000/uploads
            const baseUrl = API_BASE_URL.replace('/api', '');
            return `${baseUrl}${imagePath}`;
        }
        return imagePath;
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.itemCard}>
            <Image
                source={{ uri: getImageUrl(item.image) }}
                style={styles.itemImage}
                resizeMode="cover"
            />
            <View style={styles.itemInfo}>
                <Text style={styles.itemCategory}>{item.category}</Text>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Wardrobe</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('Upload')}
                >
                    <Plus color="#fff" size={24} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={item => item._id}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.row}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No items yet.</Text>
                        <Text style={styles.emptySubtext}>Tap + to add your first item!</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        paddingTop: 50, // simple safe area padding
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    addButton: {
        backgroundColor: '#3b82f6',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    itemCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    itemImage: {
        width: '100%',
        aspectRatio: 3 / 4,
        backgroundColor: '#f1f5f9',
    },
    itemInfo: {
        padding: 12,
    },
    itemCategory: {
        fontSize: 12,
        color: '#64748b',
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 4,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1e293b',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: '#64748b',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#94a3b8',
    },
});
