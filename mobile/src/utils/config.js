// Configuration for the mobile application

// Replace '10.0.2.2' with your computer's local IP address if running on a physical device.
// 10.0.2.2 is the special alias to your host loopback interface (127.0.0.1) on Android emulators.
// For iOS Simulator, 'http://localhost:5000/api' works.
import { Platform } from 'react-native';

const getApiUrl = () => {
    if (__DEV__) {
        // You can change this to your machine's LAN IP to test on physical device
        // e.g., 'http://192.168.1.10:5000/api'
        if (Platform.OS === 'android') {
            return 'http://10.0.2.2:5000/api';
        } else {
            // Updated to use LAN IP for physical device testing
            return 'http://192.168.1.4:5000/api';
        }
    }
    // Production URL would go here
    return 'https://your-production-url.com/api';
};

export const API_BASE_URL = getApiUrl();
