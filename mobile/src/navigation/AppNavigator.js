import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import { Home, Shirt, Sparkles, Calendar, User, LogOut } from 'lucide-react-native';

import { AuthContext } from '../context/AuthContext';

// Placeholder screens
const PlaceholderScreen = ({ name }) => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
    </View>
);

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';

// Dashboard Screens
import HomeScreen from '../screens/Dashboard/HomeScreen';
import WardrobeScreen from '../screens/Wardrobe/WardrobeScreen';
import UploadScreen from '../screens/Wardrobe/UploadScreen';
import OutfitsScreen from '../screens/Outfits/OutfitsScreen';
import CreateOutfitScreen from '../screens/Outfits/CreateOutfitScreen'; // Added

import PlannerScreen from '../screens/Planner/PlannerScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const WardrobeStack = createStackNavigator();
const OutfitsStack = createStackNavigator(); // New Stack

import ProfileScreen from '../screens/Profile/ProfileScreen';

// Wardrobe Stack (List -> Detail -> Upload)
const WardrobeStackNavigator = () => (
    <WardrobeStack.Navigator screenOptions={{ headerShown: false }}>
        <WardrobeStack.Screen name="WardrobeList" component={WardrobeScreen} />
        <WardrobeStack.Screen name="Upload" component={UploadScreen} options={{ presentation: 'modal' }} />
    </WardrobeStack.Navigator>
);

// Outfits Stack (List -> Create)
const OutfitsStackNavigator = () => (
    <OutfitsStack.Navigator screenOptions={{ headerShown: false }}>
        <OutfitsStack.Screen name="OutfitsMain" component={OutfitsScreen} />
        <OutfitsStack.Screen name="CreateOutfit" component={CreateOutfitScreen} />
    </OutfitsStack.Navigator>
);

// Main Tab Navigator
const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let IconComponent;

                    if (route.name === 'Home') IconComponent = Home;
                    else if (route.name === 'Wardrobe') IconComponent = Shirt;
                    else if (route.name === 'Outfits') IconComponent = Sparkles;
                    else if (route.name === 'Planner') IconComponent = Calendar;
                    else if (route.name === 'Profile') IconComponent = User;

                    return <IconComponent color={color} size={size} />;
                },
                tabBarActiveTintColor: '#3b82f6',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Wardrobe" component={WardrobeStackNavigator} />
            <Tab.Screen name="Outfits" component={OutfitsStackNavigator} />
            <Tab.Screen name="Planner" component={PlannerScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

// Auth Stack
const AuthNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
);

export default function AppNavigator() {
    const { isLoading, userToken } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {userToken ? <MainTabNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
}
