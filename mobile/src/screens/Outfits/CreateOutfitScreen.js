import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../services/api';
import { Check, X, Save, ArrowLeft, Filter } from 'lucide-react-native';

const CATEGORIES = [
    { id: 'TOPS', label: 'Tops' },
    { id: 'BOTTOMS', label: 'Bottoms' },
    { id: 'SHOES', label: 'Shoes' },
    { id: 'OUTERWEAR', label: 'Outerwear' },
    { id: 'ACCESSORIES', label: 'Accessories' }
];

export default function CreateOutfitScreen({ navigation }) {
    const [wardrobeItems, setWardrobeItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('TOPS');

    // Selection State
    const [selectedItems, setSelectedItems] = useState({
        TOPS: null,
        BOTTOMS: null,
        SHOES: null,
        OUTERWEAR: null,
        ACCESSORIES: [] // Array for accessories
    });

    const [outfitName, setOutfitName] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadWardrobe();
    }, []);

    const loadWardrobe = async () => {
        try {
            const data = await apiService.getWardrobeItems();
            setWardrobeItems(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load wardrobe items');
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        const API_URL = apiService.client.defaults.baseURL;
        const baseUrl = API_URL.replace('/api', '');
        return `${baseUrl}${imagePath}`;
    };

    const handleSelectItem = (item) => {
        if (selectedCategory === 'ACCESSORIES') {
            setSelectedItems(prev => {
                const current = prev.ACCESSORIES || [];
                const exists = current.find(i => i._id === item._id);
                if (exists) {
                    return { ...prev, ACCESSORIES: current.filter(i => i._id !== item._id) };
                } else {
                    return { ...prev, ACCESSORIES: [...current, item] };
                }
            });
        } else {
            setSelectedItems(prev => ({
                ...prev,
                [selectedCategory]: prev[selectedCategory]?._id === item._id ? null : item
            }));
        }
    };

    const isSelected = (item) => {
        if (selectedCategory === 'ACCESSORIES') {
            return selectedItems.ACCESSORIES?.some(i => i._id === item._id);
        }
        return selectedItems[selectedCategory]?._id === item._id;
    };

    const handleSave = async () => {
        // Validation: At least Top + Bottom OR Top + Outerwear, etc. - Basic check for now
        const hasItems = Object.values(selectedItems).some(val =>
            Array.isArray(val) ? val.length > 0 : val !== null
        );

        if (!hasItems) {
            Alert.alert('Empty Outfit', 'Please select at least one item.');
            return;
        }

        if (!outfitName.trim()) {
            Alert.alert('Missing Name', 'Please give your outfit a name.');
            return;
        }

        setSaving(true);
        try {
            // Flatten items
            const itemsArray = [
                selectedItems.TOPS,
                selectedItems.BOTTOMS,
                selectedItems.SHOES,
                selectedItems.OUTERWEAR,
                ...(selectedItems.ACCESSORIES || [])
            ].filter(Boolean);

            await apiService.saveOutfit({
                name: outfitName,
                items: itemsArray,
                occasion: 'Custom', // Default for custom creation
                date: new Date().toISOString()
            });

            Alert.alert('Success', 'Outfit created and saved!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to save outfit');
        } finally {
            setSaving(false);
        }
    };

    const filteredItems = wardrobeItems.filter(item =>
        item.category?.toUpperCase() === selectedCategory
    );

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.itemCard, isSelected(item) && styles.selectedCard]}
            onPress={() => handleSelectItem(item)}
        >
            <Image
                source={{ uri: getImageUrl(item.image) }}
                style={styles.itemImage}
                resizeMode="cover"
            />
            {isSelected(item) && (
                <View style={styles.checkOverlay}>
                    <Check color="#fff" size={20} strokeWidth={3} />
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.title}>Create Outfit</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color="#3b82f6" /> : <Save size={24} color="#3b82f6" />}
                </TouchableOpacity>
            </View>

            {/* Preview Section (Collapsible or just visible) */}
            <View style={styles.previewSection}>
                <TextInput
                    style={styles.nameInput}
                    placeholder="Name your outfit (e.g. Date Night)"
                    value={outfitName}
                    onChangeText={setOutfitName}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
                    {Object.values(selectedItems).flat().filter(Boolean).map((item, idx) => (
                        <View key={idx} style={styles.previewThumbnail}>
                            <Image source={{ uri: getImageUrl(item.image) }} style={styles.previewImage} />
                            <TouchableOpacity
                                style={styles.removePreviewBtn}
                                onPress={() => {
                                    // Reverse logic to remove item
                                    const cat = item.category?.toUpperCase();
                                    if (cat === 'ACCESSORIES') {
                                        setSelectedItems(prev => ({
                                            ...prev,
                                            ACCESSORIES: prev.ACCESSORIES.filter(i => i._id !== item._id)
                                        }));
                                    } else {
                                        setSelectedItems(prev => ({ ...prev, [cat]: null }));
                                    }
                                }}
                            >
                                <X size={12} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    {Object.values(selectedItems).every(v => !v || (Array.isArray(v) && v.length === 0)) && (
                        <Text style={styles.emptyPreviewText}>Select items to build your outfit</Text>
                    )}
                </ScrollView>
            </View>

            {/* Category Tabs */}
            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[styles.tab, selectedCategory === cat.id && styles.activeTab]}
                            onPress={() => setSelectedCategory(cat.id)}
                        >
                            <Text style={[styles.tabText, selectedCategory === cat.id && styles.activeTabText]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.divider} />

            {/* Wardrobe Grid */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    numColumns={3}
                    contentContainerStyle={styles.gridContent}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No items in this category.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    backBtn: {
        padding: 4,
    },
    previewSection: {
        padding: 16,
        backgroundColor: '#f8fafc',
    },
    nameInput: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 12,
        fontSize: 16,
    },
    previewScroll: {
        flexDirection: 'row',
        height: 80,
    },
    previewThumbnail: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#fff',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    previewImage: {
        width: '90%',
        height: '90%',
        resizeMode: 'contain',
    },
    removePreviewBtn: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fff',
    },
    emptyPreviewText: {
        color: '#94a3b8',
        fontStyle: 'italic',
        marginTop: 20,
        marginLeft: 4,
    },
    tabsContainer: {
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        marginHorizontal: 4,
    },
    activeTab: {
        backgroundColor: '#3b82f6',
    },
    tabText: {
        color: '#64748b',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#fff',
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
    },
    gridContent: {
        padding: 8,
    },
    itemCard: {
        flex: 1,
        aspectRatio: 1,
        margin: 4,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedCard: {
        borderColor: '#3b82f6',
    },
    itemImage: {
        width: '100%',
        height: '100%',
    },
    checkOverlay: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        padding: 2,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 16,
    }
});
