import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Modal, Dimensions, FlatList } from 'react-native';
import { apiService } from '../../services/api';
import { Sparkles, Bookmark, Plus, X, Heart, RefreshCw, Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function OutfitsScreen({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [recommendation, setRecommendation] = useState(null);
    const [saving, setSaving] = useState(false);

    // Modals
    const [showOccasionModal, setShowOccasionModal] = useState(false);

    // Saved Outfits State
    const [savedOutfits, setSavedOutfits] = useState([]);
    const [showSavedModal, setShowSavedModal] = useState(false);
    const [loadingSaved, setLoadingSaved] = useState(false);

    const occasions = [
        { id: 'casual', label: 'Casual', color: '#3b82f6' },
        { id: 'work', label: 'Work', color: '#10b981' },
        { id: 'formal', label: 'Formal', color: '#8b5cf6' },
        { id: 'sporty', label: 'Sporty', color: '#f59e0b' },
        { id: 'random', label: 'Random', color: '#64748b' }
    ];

    const fetchSavedOutfits = async () => {
        setLoadingSaved(true);
        try {
            const data = await apiService.getSavedOutfits();
            setSavedOutfits(data);
        } catch (error) {
            console.error('Error fetching saved outfits:', error);
            Alert.alert('Error', 'Failed to load saved outfits');
        } finally {
            setLoadingSaved(false);
        }
    };

    const handleOpenSaved = () => {
        setShowSavedModal(true);
        fetchSavedOutfits();
    };

    const handleDeleteSaved = async (id) => {
        Alert.alert(
            "Delete Outfit",
            "Are you sure you want to delete this outfit?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await apiService.deleteSavedOutfit(id);
                            // Optimistic update
                            setSavedOutfits(prev => prev.filter(item => item._id !== id));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete outfit');
                        }
                    }
                }
            ]
        );
    };

    const handleStyleIt = async (occasion) => {
        setLoading(true);
        setShowOccasionModal(false);
        setRecommendation(null);

        try {
            const data = await apiService.getOutfitRecommendation(occasion);
            if (data && data.recommendedOutfit) {
                setRecommendation({ ...data, occasion });
            } else {
                Alert.alert('No Outfit Found', data?.message || 'Try adding more items!');
            }
        } catch (error) {
            console.error('Error generating outfit:', error);
            Alert.alert('Error', 'Failed to generate outfit');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveOutfit = async () => {
        if (!recommendation) return;
        setSaving(true);
        try {
            const occasion = recommendation.occasion;

            // Flatten the outfit object into an array for the backend
            const itemsArray = [
                recommendation.recommendedOutfit.top,
                recommendation.recommendedOutfit.bottom,
                recommendation.recommendedOutfit.shoes,
                recommendation.recommendedOutfit.outerwear,
                ...(Array.isArray(recommendation.recommendedOutfit.accessories) ? recommendation.recommendedOutfit.accessories : [])
            ].filter(Boolean);

            await apiService.saveOutfit({
                name: `${occasion.charAt(0).toUpperCase() + occasion.slice(1)} Outfit`,
                items: itemsArray,
                occasion: occasion,
                date: new Date().toISOString()
            });
            Alert.alert('Success', 'Outfit saved to your Collection!');
            setRecommendation(null); // Clear after save
        } catch (error) {
            console.error('Save error details:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to save outfit');
        } finally {
            setSaving(false);
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        const API_URL = apiService.client.defaults.baseURL;
        const baseUrl = API_URL.replace('/api', '');
        return `${baseUrl}${imagePath}`;
    };

    const OutfitItem = ({ item, label }) => (
        <View style={styles.outfitItem}>
            <Image source={{ uri: getImageUrl(item.image) }} style={styles.outfitImage} />
            <Text style={styles.outfitLabel}>{item.category || label}</Text>
        </View>
    );

    const renderSavedOutfit = ({ item }) => (
        <View style={styles.savedOutfitCard}>
            <View style={styles.savedHeader}>
                <Text style={styles.savedTitle}>{item.name || 'Saved Outfit'}</Text>
                <TouchableOpacity onPress={() => handleDeleteSaved(item._id)} style={{ padding: 4 }}>
                    <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
            </View>
            <View style={styles.savedItemsRow}>
                {item.items && item.items.slice(0, 4).map((imgItem, idx) => (
                    <Image
                        key={idx}
                        source={{ uri: getImageUrl(imgItem.image) }}
                        style={styles.savedItemThumb}
                    />
                ))}
                {item.items && item.items.length > 4 && (
                    <View style={styles.moreItemsBadge}>
                        <Text style={styles.moreItemsText}>+{item.items.length - 4}</Text>
                    </View>
                )}
            </View>
            <Text style={styles.savedDate}>
                {new Date(item.createdAt).toLocaleDateString()} • {item.occasion}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Outfit Recommendations</Text>
                <Text style={styles.headerSubtitle}>Generate New Outfit</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Main Action Cards */}
                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: '#3b82f6' }]}
                        onPress={() => setShowOccasionModal(true)}
                    >
                        <Sparkles color="#fff" size={32} />
                        <Text style={styles.actionTitle}>Style It!</Text>
                        <Text style={styles.actionDesc}>AI Generator</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: '#f59e0b' }]}
                        onPress={handleOpenSaved}
                    >
                        <Bookmark color="#fff" size={32} />
                        <Text style={styles.actionTitle}>View Saved</Text>
                        <Text style={styles.actionDesc}>Your Collection</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: '#10b981' }]}
                        onPress={() => navigation.navigate('CreateOutfit')}
                    >
                        <Plus color="#fff" size={32} />
                        <Text style={styles.actionTitle}>Create</Text>
                        <Text style={styles.actionDesc}>Build Your Own</Text>
                    </TouchableOpacity>
                </View>

                {/* Recommendation Result Area */}
                {loading && (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text style={styles.loadingText}>Styling your look...</Text>
                    </View>
                )}

                {recommendation && (
                    <View style={styles.resultCard}>
                        <View style={styles.resultHeader}>
                            <Text style={styles.resultTitle}>{recommendation.occasion.toUpperCase()} LOOK</Text>
                            <View style={styles.resultActions}>
                                <TouchableOpacity onPress={() => handleStyleIt(recommendation.occasion)} style={styles.iconBtn}>
                                    <RefreshCw size={20} color="#64748b" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setRecommendation(null)} style={styles.iconBtn}>
                                    <X size={20} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {recommendation.stylingTips && (
                            <View style={styles.tipBox}>
                                <Text style={styles.tipText}>{recommendation.stylingTips}</Text>
                            </View>
                        )}

                        <View style={styles.outfitGrid}>
                            {[
                                recommendation.recommendedOutfit.top,
                                recommendation.recommendedOutfit.bottom,
                                recommendation.recommendedOutfit.shoes,
                                recommendation.recommendedOutfit.outerwear,
                                ...(Array.isArray(recommendation.recommendedOutfit.accessories) ? recommendation.recommendedOutfit.accessories : [])
                            ].filter(Boolean).map((item, index) => (
                                <OutfitItem key={index} item={item} />
                            ))}
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSaveOutfit} disabled={saving}>
                            {saving ? <ActivityIndicator color="#fff" /> : (
                                <>
                                    <Heart color="#fff" size={20} style={{ marginRight: 8 }} />
                                    <Text style={styles.saveButtonText}>Save Look</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Occasion Selection Modal */}
            <Modal
                visible={showOccasionModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowOccasionModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Choose Occasion</Text>
                            <TouchableOpacity onPress={() => setShowOccasionModal(false)}>
                                <X size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalGrid}>
                            {occasions.map((occ) => (
                                <TouchableOpacity
                                    key={occ.id}
                                    style={[styles.occasionBtn, { backgroundColor: occ.color }]}
                                    onPress={() => handleStyleIt(occ.id)}
                                >
                                    <Text style={styles.occasionBtnText}>{occ.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Saved Outfits Modal */}
            <Modal
                visible={showSavedModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowSavedModal(false)}
            >
                <View style={styles.fullScreenModal}>
                    <View style={styles.fullScreenHeader}>
                        <Text style={styles.fullScreenTitle}>Saved Collection</Text>
                        <TouchableOpacity onPress={() => setShowSavedModal(false)} style={styles.closeButton}>
                            <X size={24} color="#1e293b" />
                        </TouchableOpacity>
                    </View>

                    {loadingSaved ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color="#3b82f6" />
                        </View>
                    ) : (
                        <FlatList
                            data={savedOutfits}
                            renderItem={renderSavedOutfit}
                            keyExtractor={item => item._id}
                            contentContainerStyle={styles.savedListContent}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Heart size={48} color="#cbd5e1" />
                                    <Text style={styles.emptyText}>No saved outfits yet</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748b',
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    actionCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        height: 120,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    actionTitle: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    actionDesc: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        textAlign: 'center',
    },
    loaderContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#64748b',
    },
    resultCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#64748b',
        letterSpacing: 1,
    },
    resultActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconBtn: {
        padding: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
    },
    tipBox: {
        backgroundColor: '#eff6ff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
    },
    tipText: {
        color: '#1e40af',
        fontSize: 14,
        fontStyle: 'italic',
    },
    outfitGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    outfitItem: {
        width: '47%',
        aspectRatio: 0.8,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    outfitImage: {
        width: '100%',
        height: '80%',
        resizeMode: 'contain',
        marginBottom: 8,
    },
    outfitLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    saveButton: {
        backgroundColor: '#ec4899',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#ec4899',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: 300,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    modalGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    occasionBtn: {
        width: '47%',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    occasionBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Full Screen Modal Styles
    fullScreenModal: {
        flex: 1,
        backgroundColor: '#f8fafc',
        marginTop: 50, // iOS handle
    },
    fullScreenHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    fullScreenTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    closeButton: {
        padding: 4,
    },
    savedListContent: {
        padding: 16,
    },
    savedOutfitCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    savedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    savedTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    savedItemsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    savedItemThumb: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
        resizeMode: 'cover',
    },
    moreItemsBadge: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreItemsText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748b',
    },
    savedDate: {
        fontSize: 12,
        color: '#94a3b8',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#94a3b8',
    }
});
