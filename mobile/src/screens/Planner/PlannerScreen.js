
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, ActivityIndicator, Alert, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../services/api';
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Calendar as CalendarIcon, Shirt, Heart, Check } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function PlannerScreen({ navigation }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [plannedOutfits, setPlannedOutfits] = useState({});
    const [loading, setLoading] = useState(true);
    const [weekStart, setWeekStart] = useState(new Date());

    // Planning Modal State
    const [isPlanningModalVisible, setPlanningModalVisible] = useState(false);
    const [isSavedPickerVisible, setSavedPickerVisible] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [outfitName, setOutfitName] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [outfitOccasion, setOutfitOccasion] = useState('Casual');

    // Saved Outfits for Picker
    const [savedOutfits, setSavedOutfits] = useState([]);
    const [loadingSaved, setLoadingSaved] = useState(false);

    // Initialize week start based on current date
    useEffect(() => {
        const start = new Date(selectedDate);
        start.setDate(selectedDate.getDate() - selectedDate.getDay()); // Start on Sunday
        start.setHours(0, 0, 0, 0);
        setWeekStart(start);
    }, []);

    const fetchOutfits = async () => {
        try {
            const data = await apiService.getPlannedOutfits();

            // Convert array to object keyed by date string (YYYY-MM-DD)
            const outfitsByDate = {};
            data.forEach(item => {
                // Ensure we use local date string for consistent keying
                const dateKey = new Date(item.date).toLocaleDateString('en-CA'); // YYYY-MM-DD format
                outfitsByDate[dateKey] = item;
            });
            setPlannedOutfits(outfitsByDate);
        } catch (error) {
            console.error('Error fetching planned outfits:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSavedOutfits = async () => {
        setLoadingSaved(true);
        try {
            const data = await apiService.getSavedOutfits();
            setSavedOutfits(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load saved outfits');
        } finally {
            setLoadingSaved(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOutfits();
        }, [])
    );

    // Generate days for the current week view
    const weekDates = useMemo(() => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            dates.push(day);
        }
        return dates;
    }, [weekStart]);

    const changeWeek = (direction) => {
        const newStart = new Date(weekStart);
        if (direction === 0) { // "Today" button
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            newStart.setDate(today.getDate() - today.getDay());
        } else {
            newStart.setDate(weekStart.getDate() + (direction * 7));
        }
        setWeekStart(newStart);
        setSelectedDate(newStart); // Select the first day of the new week by default
    };

    const formatDateKey = (date) => {
        return date.toLocaleDateString('en-CA'); // YYYY-MM-DD
    };

    const getOutfitForDate = (date) => {
        const key = formatDateKey(date);
        return plannedOutfits[key];
    };

    const handleDayPress = (date) => {
        setSelectedDate(date);
    };

    const handleDelete = async (id) => {
        Alert.alert(
            "Delete Outfit",
            "Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await apiService.deleteOutfit(id);
                            fetchOutfits(); // Refresh
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete');
                        }
                    }
                }
            ]
        );
    };

    // Planning Modal Handlers
    const openPlanningModal = () => {
        setOutfitName('');
        setSelectedItems([]);
        setOutfitOccasion('Casual');
        setPlanningModalVisible(true);
    };

    const openSavedPicker = () => {
        setPlanningModalVisible(false); // Close first modal
        setTimeout(() => {
            setSavedPickerVisible(true); // Open second modal after short delay
            fetchSavedOutfits();
        }, 100);
    };

    const handleSelectSavedOutfit = (outfit) => {
        setOutfitName(outfit.name || 'Planned Outfit');
        setOutfitOccasion(outfit.occasion);
        setSelectedItems(outfit.items || []);

        setSavedPickerVisible(false);
        setTimeout(() => {
            setPlanningModalVisible(true); // Re-open planning modal
        }, 100);
    };

    const closeSavedPicker = () => {
        setSavedPickerVisible(false);
        setTimeout(() => {
            setPlanningModalVisible(true); // Re-open planning modal on cancel
        }, 100);
    };

    const handleSavePlan = async () => {
        if (selectedItems.length === 0) {
            Alert.alert('Empty Outfit', 'Please add items to your outfit.');
            return;
        }

        setSaving(true);
        try {
            await apiService.planOutfit({
                date: selectedDate.toISOString(),
                name: outfitName || 'My Outfit',
                items: selectedItems,
                occasion: outfitOccasion,
                notes: ''
            });
            setPlanningModalVisible(false);
            fetchOutfits(); // Refresh calendar
            Alert.alert('Success', 'Outfit planned successfully!');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to plan outfit');
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

    // Render Logic
    const selectedDateKey = formatDateKey(selectedDate);
    const currentOutfit = plannedOutfits[selectedDateKey];

    // Helper: Week Label
    const weekLabel = useMemo(() => {
        const startMonth = weekDates[0].toLocaleDateString('en-US', { month: 'short' });
        const endMonth = weekDates[6].toLocaleDateString('en-US', { month: 'short' });
        const startDay = weekDates[0].getDate();
        const endDay = weekDates[6].getDate();
        return `${startMonth} ${startDay} - ${endMonth} ${endDay} `;
    }, [weekDates]);

    const renderSavedOutfit = ({ item }) => (
        <TouchableOpacity style={styles.savedPickerItem} onPress={() => handleSelectSavedOutfit(item)}>
            <Image source={{ uri: getImageUrl(item.items?.[0]?.image) }} style={styles.savedPickerThumb} />
            <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text style={styles.savedPickerTitle}>{item.name}</Text>
                <Text style={styles.savedPickerSub}>{new Date(item.createdAt).toLocaleDateString()} • {item.occasion}</Text>
            </View>
            <Plus size={20} color="#3b82f6" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Outfit Planner</Text>
                    <Text style={styles.headerSubtitle}>Plan your week ahead</Text>
                </View>
                <TouchableOpacity onPress={() => changeWeek(0)} style={styles.todayButton}>
                    <Text style={styles.todayButtonText}>Today</Text>
                </TouchableOpacity>
            </View>

            {/* Week Calendar Strip */}
            <View style={styles.calendarContainer}>
                <View style={styles.weekControl}>
                    <TouchableOpacity onPress={() => changeWeek(-1)} style={styles.arrowButton}>
                        <ChevronLeft size={24} color="#64748b" />
                    </TouchableOpacity>
                    <Text style={styles.weekLabel}>{weekLabel}</Text>
                    <TouchableOpacity onPress={() => changeWeek(1)} style={styles.arrowButton}>
                        <ChevronRight size={24} color="#64748b" />
                    </TouchableOpacity>
                </View>

                <View style={styles.daysRow}>
                    {weekDates.map((date, index) => {
                        const isSelected = formatDateKey(date) === formatDateKey(selectedDate);
                        const isToday = formatDateKey(date) === formatDateKey(new Date());
                        const hasOutfit = !!getOutfitForDate(date);

                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.dayCard,
                                    isSelected && styles.dayCardSelected,
                                    isToday && !isSelected && styles.dayCardToday
                                ]}
                                onPress={() => handleDayPress(date)}
                            >
                                <Text style={[styles.dayName, isSelected && styles.textSelected]}>
                                    {date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                                </Text>
                                <View style={[
                                    styles.dateCircle,
                                    isSelected && styles.dateCircleSelected,
                                    hasOutfit && !isSelected && styles.dateCircleHasOutfit
                                ]}>
                                    <Text style={[styles.dayNumber, isSelected && styles.textSelected, hasOutfit && !isSelected && styles.textHasOutfit]}>
                                        {date.getDate()}
                                    </Text>
                                </View>
                                {hasOutfit && <View style={styles.dotIndicator} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Selected Day Content */}
            <ScrollView style={styles.content}>
                <View style={styles.dateHeader}>
                    <Text style={styles.selectedDateTitle}>
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Text>
                </View>

                {currentOutfit ? (
                    <View style={styles.outfitCard}>
                        <View style={styles.outfitHeader}>
                            <Text style={styles.outfitName}>{currentOutfit.name || 'Planned Outfit'}</Text>
                            <TouchableOpacity onPress={() => handleDelete(currentOutfit._id)} style={styles.actionButton}>
                                <Trash2 size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.occasionTag}>{currentOutfit.occasion || 'Casual'}</Text>

                        <View style={styles.itemsGrid}>
                            {currentOutfit.items && currentOutfit.items.map((item, idx) => (
                                <View key={idx} style={styles.itemWrapper}>
                                    <Image
                                        source={{ uri: getImageUrl(item.image) }}
                                        style={styles.itemImage}
                                    />
                                </View>
                            ))}
                        </View>
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconContainer}>
                            <Shirt size={48} color="#cbd5e1" />
                        </View>
                        <Text style={styles.emptyTitle}>No outfit planned</Text>
                        <TouchableOpacity style={styles.planButton} onPress={openPlanningModal}>
                            <Plus size={20} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.planButtonText}>Plan Outfit</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Planning Modal */}
            <Modal visible={isPlanningModalVisible} animationType="slide" onRequestClose={() => setPlanningModalVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Plan Outfit</Text>
                        <TouchableOpacity onPress={() => setPlanningModalVisible(false)}>
                            <Text style={styles.modalCloseText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <Text style={styles.label}>Outfit Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Work Meeting"
                            value={outfitName}
                            onChangeText={setOutfitName}
                        />

                        <Text style={styles.label}>Items</Text>
                        {selectedItems.length > 0 ? (
                            <View style={styles.previewGrid}>
                                {selectedItems.map((item, idx) => (
                                    <Image key={idx} source={{ uri: getImageUrl(item.image) }} style={styles.previewThumb} />
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.emptyPreviewText}>No items selected yet</Text>
                        )}

                        <TouchableOpacity style={styles.addOptionBtn} onPress={openSavedPicker}>
                            <Heart size={20} color="#ec4899" />
                            <Text style={styles.addOptionText}>Add Saved Outfit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.addOptionBtn} onPress={() => Alert.alert('Coming Soon', 'Custom item selection coming soon!')}>
                            <Shirt size={20} color="#3b82f6" />
                            <Text style={styles.addOptionText}>Add Items</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.savePlanBtn} onPress={handleSavePlan} disabled={saving}>
                            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.savePlanText}>Save Plan</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>

            {/* Saved Outfits Picker Modal */}
            <Modal visible={isSavedPickerVisible} animationType="slide" onRequestClose={closeSavedPicker}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Saved Outfit</Text>
                        <TouchableOpacity onPress={closeSavedPicker}>
                            <X size={24} color="#000" />
                        </TouchableOpacity>
                    </View>
                    {loadingSaved ? (
                        <ActivityIndicator style={{ marginTop: 20 }} />
                    ) : (
                        <FlatList
                            data={savedOutfits}
                            renderItem={renderSavedOutfit}
                            keyExtractor={item => item._id}
                            contentContainerStyle={{ padding: 16 }}
                            ListEmptyComponent={<Text style={styles.emptyText}>No saved outfits.</Text>}
                        />
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
    headerSubtitle: { fontSize: 14, color: '#64748b' },
    todayButton: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    todayButtonText: { color: '#3b82f6', fontWeight: '600', fontSize: 14 },
    calendarContainer: { backgroundColor: '#fff', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 3, zIndex: 10 },
    weekControl: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
    weekLabel: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
    arrowButton: { padding: 8 },
    daysRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
    dayCard: { alignItems: 'center', padding: 8, borderRadius: 12, width: 44 },
    dayCardSelected: { backgroundColor: '#3b82f6' },
    dayCardToday: { backgroundColor: '#eff6ff' },
    dayName: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 },
    textSelected: { color: '#fff' },
    dateCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
    dateCircleSelected: { backgroundColor: 'rgba(255,255,255,0.2)' },
    dateCircleHasOutfit: { backgroundColor: '#e2e8f0' },
    dayNumber: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    textHasOutfit: { color: '#3b82f6' },
    dotIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#3b82f6', marginTop: 4 },
    content: { flex: 1, padding: 24 },
    dateHeader: { marginBottom: 20 },
    selectedDateTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    outfitCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
    outfitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    outfitName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    occasionTag: { fontSize: 14, color: '#64748b', textTransform: 'uppercase', marginBottom: 16 },
    itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    itemWrapper: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#f8fafc', padding: 4, borderWidth: 1, borderColor: '#e2e8f0' },
    itemImage: { width: '100%', height: '100%', resizeMode: 'contain' },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#cbd5e1', marginBottom: 24 },
    planButton: { backgroundColor: '#3b82f6', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 },
    planButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    modalCloseText: { color: '#ef4444', fontSize: 16 },
    modalContent: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16 },
    previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    previewThumb: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#fff' },
    emptyPreviewText: { color: '#94a3b8', fontStyle: 'italic', marginBottom: 16 },
    addOptionBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    addOptionText: { marginLeft: 12, fontSize: 16, fontWeight: '500', color: '#1e293b' },
    savePlanBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
    savePlanText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    savedPickerItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    savedPickerThumb: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#f1f5f9' },
    savedPickerTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
    savedPickerSub: { fontSize: 12, color: '#64748b' },
    emptyText: { textAlign: 'center', marginTop: 20, color: '#94a3b8' },
    actionButton: {
        padding: 8,
    }
});

