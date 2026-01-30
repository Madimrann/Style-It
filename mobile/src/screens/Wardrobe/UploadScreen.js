import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput, ActivityIndicator, Alert, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, Check, X, Tag, Sparkles } from 'lucide-react-native';
import { apiService } from '../../services/api';

export default function UploadScreen({ navigation }) {
    const [image, setImage] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState('pick'); // pick, analyze, edit

    // Form data
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState(''); // comma separated string
    const [occasionTags, setOccasionTags] = useState([]);
    const [color, setColor] = useState('');
    const [description, setDescription] = useState('');

    const requestPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'We need access to your photos to upload items.');
        }
    };

    useEffect(() => {
        requestPermission();
    }, []);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0]);
            setStep('analyze');
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'We need access to your camera to take photos.');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0]);
            setStep('analyze');
        }
    };

    const analyzeImage = async () => {
        if (!image) return;
        setAnalyzing(true);
        try {
            // First, remove background
            console.log("Processing background removal...");
            const bgResult = await apiService.removeBackground(image.uri);

            let imageToAnalyze = image.uri;
            if (bgResult && !bgResult.fallback) {
                console.log("Background removed successfully");
                // Update the displayed image to the background-removed version
                setImage({ ...image, uri: bgResult.uri });
                imageToAnalyze = bgResult.uri;
            }

            // Then analyze the (potentially processed) image
            const result = await apiService.analyzeImage(imageToAnalyze);

            setName(result.category + ' ' + (result.color || 'Item'));
            setCategory(result.category || '');
            setTags(result.tags ? result.tags.join(', ') : '');
            setOccasionTags(result.occasionTags || []);
            setColor(result.color || '');
            setDescription(result.description || '');

            setStep('edit');
        } catch (error) {
            console.error("❌ UploadScreen Analysis Error:", error);
            Alert.alert('Analysis Failed', 'Could not analyze image. You can enter details manually.');
            setStep('edit');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSave = async () => {
        if (!name || !category) {
            Alert.alert('Missing Info', 'Please provide at least a name and category.');
            return;
        }

        setSaving(true);
        try {
            await apiService.addWardrobeItem({
                image: image,
                name,
                category,
                tags: tags.split(',').map(t => t.trim()),
                occasionTags,
                color,
                description
            });
            Alert.alert('Success', 'Item added to wardrobe!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to save item. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const toggleOccasion = (tag) => {
        if (occasionTags.includes(tag)) {
            setOccasionTags(occasionTags.filter(t => t !== tag));
        } else {
            setOccasionTags([...occasionTags, tag]);
        }
    };

    const OCCASIONS = ['casual', 'formal', 'work', 'sporty', 'party'];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <X color="#1e293b" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add New Item</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {step === 'pick' && (
                    <View style={styles.pickContainer}>
                        <Text style={styles.instruction}>Select an image of your clothing item</Text>

                        <View style={styles.pickButtons}>
                            <TouchableOpacity style={styles.pickButton} onPress={takePhoto}>
                                <View style={[styles.iconCircle, { backgroundColor: '#e0f2fe' }]}>
                                    <Camera color="#0ea5e9" size={32} />
                                </View>
                                <Text style={styles.pickLabel}>Camera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.pickButton} onPress={pickImage}>
                                <View style={[styles.iconCircle, { backgroundColor: '#f3e8ff' }]}>
                                    <ImageIcon color="#9333ea" size={32} />
                                </View>
                                <Text style={styles.pickLabel}>Gallery</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {(step === 'analyze' || step === 'edit') && image && (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: image.uri }} style={styles.previewImage} resizeMode="contain" />

                        {step === 'analyze' && (
                            <View style={styles.analyzeActions}>
                                <TouchableOpacity
                                    style={styles.analyzeButton}
                                    onPress={analyzeImage}
                                    disabled={analyzing}
                                >
                                    {analyzing ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Sparkles color="#fff" size={20} style={{ marginRight: 8 }} />
                                            <Text style={styles.buttonText}>Analyze with AI</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setStep('edit')}>
                                    <Text style={styles.skipText}>Skip Analysis</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {step === 'edit' && (
                    <View style={styles.form}>
                        <Text style={styles.sectionHeader}>Item Details</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g., Blue Denim Jacket"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Category</Text>
                            <TextInput
                                style={styles.input}
                                value={category}
                                onChangeText={setCategory}
                                placeholder="e.g., Tops, Bottoms, Shoes"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Color</Text>
                            <TextInput
                                style={styles.input}
                                value={color}
                                onChangeText={setColor}
                                placeholder="e.g., Blue"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Occasions</Text>
                            <View style={styles.chips}>
                                {OCCASIONS.map(occ => (
                                    <TouchableOpacity
                                        key={occ}
                                        style={[
                                            styles.chip,
                                            occasionTags.includes(occ) && styles.chipActive
                                        ]}
                                        onPress={() => toggleOccasion(occ)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            occasionTags.includes(occ) && styles.chipTextActive
                                        ]}>{occ}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Tags (comma separated)</Text>
                            <TextInput
                                style={styles.input}
                                value={tags}
                                onChangeText={setTags}
                                placeholder="e.g., denim, winter, vintage"
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Save Item</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
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
        padding: 16,
        paddingTop: Platform.OS === 'android' ? 40 : 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    content: {
        padding: 24,
    },
    pickContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    instruction: {
        fontSize: 18,
        color: '#64748b',
        marginBottom: 32,
        textAlign: 'center',
    },
    pickButtons: {
        flexDirection: 'row',
        gap: 24,
    },
    pickButton: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    pickLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#334155',
    },
    previewContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    previewImage: {
        width: 250,
        height: 300,
        borderRadius: 16,
        backgroundColor: '#f8fafc',
    },
    analyzeActions: {
        width: '100%',
        alignItems: 'center',
        marginTop: 24,
    },
    analyzeButton: {
        flexDirection: 'row',
        backgroundColor: '#3b82f6',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
        width: '100%',
        justifyContent: 'center',
    },
    skipText: {
        color: '#64748b',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    form: {
        width: '100%',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 24,
        marginTop: 8,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748b',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#1e293b',
        backgroundColor: '#f8fafc',
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
    },
    chipActive: {
        backgroundColor: '#3b82f6',
    },
    chipText: {
        fontSize: 14,
        color: '#64748b',
    },
    chipTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#3b82f6',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 40,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
