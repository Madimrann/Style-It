import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../utils/config';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Buffer } from 'buffer';

class ApiService {
    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        });

        // Request interceptor
        this.client.interceptors.request.use(
            async (config) => {
                // Get token from SecureStore
                const token = await SecureStore.getItemAsync('userToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
                return config;
            },
            (error) => {
                console.error('❌ Request Error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => {
                console.log('✅ API Response:', response.status, response.config.url);
                return response;
            },
            (error) => {
                console.error('❌ API Error:', {
                    message: error.message,
                    code: error.code,
                    url: error.config?.url,
                });
                return Promise.reject(error);
            }
        );
    }

    // Authentication
    async login(email, password) {
        try {
            const response = await this.client.post('/auth/login', { email, password });
            if (response.data.token) {
                await SecureStore.setItemAsync('userToken', response.data.token);
                if (response.data.user) {
                    await SecureStore.setItemAsync('userData', JSON.stringify(response.data.user));
                }
            }
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async signup(email, password, name) {
        try {
            const response = await this.client.post('/auth/signup', { email, password, name });
            if (response.data.token) {
                await SecureStore.setItemAsync('userToken', response.data.token);
                if (response.data.user) {
                    await SecureStore.setItemAsync('userData', JSON.stringify(response.data.user));
                }
            }
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async logout() {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userData');
    }

    async getCurrentUser() {
        try {
            const response = await this.client.get('/auth/me');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Wardrobe
    async getWardrobeItems() {
        const response = await this.client.get('/wardrobe');
        return response.data;
    }

    async addWardrobeItem(itemData) {
        const formData = new FormData();

        // itemData.image should be an object: { uri, name, type }
        if (itemData.image && itemData.image.uri) {
            const uri = itemData.image.uri;
            const filename = uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            formData.append('image', {
                uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                name: filename,
                type: type,
            });
        }

        // Append other fields
        for (const key of Object.keys(itemData)) {
            if (key !== 'image') {
                // Handle arrays (tags, occasionTags)
                if (Array.isArray(itemData[key])) {
                    itemData[key].forEach(val => formData.append(key, val));
                } else {
                    formData.append(key, itemData[key]);
                }
            }
        }

        const response = await this.client.post('/wardrobe', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    async deleteWardrobeItem(id) {
        return (await this.client.delete(`/wardrobe/${id}`)).data;
    }

    // Outfits
    async getSavedOutfits() {
        return (await this.client.get('/outfits')).data;
    }

    async saveOutfit(outfitData) {
        return (await this.client.post('/outfits', outfitData)).data;
    }

    async deleteSavedOutfit(id) {
        return (await this.client.delete(`/outfits/${id}`)).data;
    }

    // Categories & Occasions
    async getCategories() {
        return (await this.client.get('/categories')).data;
    }

    async getOccasions() {
        return (await this.client.get('/occasions')).data;
    }

    // AI & Analysis
    async analyzeImage(imageUri) {
        try {
            console.log('🔍 Starting analysis for URI:', imageUri);
            const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
            console.log('📦 Base64 created, length:', base64.length);

            const response = await this.client.post('/analyze-image', { imageData: base64 });
            console.log('✅ Analysis response received');
            return response.data;
        } catch (error) {
            console.error('❌ Analysis failed in service:', error);
            throw error;
        }
    }

    async removeBackground(imageUri) {
        try {
            console.log('🖼️ Removing background for URI:', imageUri);
            const fileInfo = await FileSystem.getInfoAsync(imageUri);
            if (!fileInfo.exists) {
                throw new Error('Image file does not exist');
            }

            // Read as base64
            const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });

            // Post as JSON
            const token = await SecureStore.getItemAsync('userToken');
            const headers = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch(`${this.client.defaults.baseURL}/remove-background`, {
                method: 'POST',
                body: JSON.stringify({ imageData: base64 }),
                headers: headers,
            });

            if (!response.ok) {
                throw new Error(`Background removal failed with status ${response.status}`);
            }

            // Get the blob/arraybuffer from response
            const arrayBuffer = await response.arrayBuffer();
            const resultBase64 = Buffer.from(arrayBuffer).toString('base64');
            const processedUri = `data:image/png;base64,${resultBase64}`;

            // Save to temp file for display/upload usage
            const filename = imageUri.split('/').pop();
            const tempFile = `${FileSystem.cacheDirectory}processed_${filename || 'image.png'}`;
            await FileSystem.writeAsStringAsync(tempFile, resultBase64, { encoding: 'base64' });

            return { uri: tempFile, base64: processedUri };

        } catch (error) {
            console.error('❌ Background removal failed:', error);
            console.log('⚠️ Returning original image as fallback');
            return { uri: imageUri, fallback: true };
        }
    }

    async getOutfitRecommendation(occasion) {
        return (await this.client.get(`/recommend-outfit/${occasion}`)).data;
    }

    async getPlannedOutfits() {
        return (await this.client.get('/planned-outfits')).data;
    }

    async planOutfit(outfitData) {
        return (await this.client.post('/planned-outfits', outfitData)).data;
    }

    async deleteOutfit(id) {
        return (await this.client.delete(`/planned-outfits/${id}`)).data;
    }

    async renameOutfit(id, newName) {
        return (await this.client.put(`/planned-outfits/${id}`, { name: newName })).data;
    }

    // Helper to check auth
    async checkAuth() {
        const token = await SecureStore.getItemAsync('userToken');
        return !!token;
    }
}

export const apiService = new ApiService();
