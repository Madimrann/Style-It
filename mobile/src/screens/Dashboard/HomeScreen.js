import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { Shirt, Sparkles, Plus, Calendar, LogOut } from 'lucide-react-native';

export default function HomeScreen({ navigation }) {
    const { userData, logout } = useContext(AuthContext);

    const QuickAction = ({ icon: Icon, label, onPress, color }) => (
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: color + '10' }]} onPress={onPress}>
            <View style={[styles.iconContainer, { backgroundColor: color }]}>
                <Icon color="#fff" size={24} />
            </View>
            <Text style={[styles.actionLabel, { color: '#334155' }]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hello,</Text>
                        <Text style={styles.username}>{userData?.name || 'User'}</Text>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                        <LogOut color="#64748b" size={24} />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.grid}>
                        <QuickAction
                            icon={Plus}
                            label="Add Item"
                            color="#3b82f6"
                            onPress={() => navigation.navigate('Wardrobe', { screen: 'Upload' })}
                        />
                        <QuickAction
                            icon={Shirt}
                            label="Wardrobe"
                            color="#8b5cf6"
                            onPress={() => navigation.navigate('Wardrobe')}
                        />
                        <QuickAction
                            icon={Sparkles}
                            label="Style Me"
                            color="#ec4899"
                            onPress={() => navigation.navigate('Outfits')}
                        />
                        <QuickAction
                            icon={Calendar}
                            label="Planner"
                            color="#f59e0b"
                            onPress={() => navigation.navigate('Planner')}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Style Tip of the Day</Text>
                    <View style={styles.tipCard}>
                        <Sparkles color="#eab308" size={24} style={{ marginBottom: 8 }} />
                        <Text style={styles.tipText}>
                            "Darker colors are generally more formal, while lighter colors are more casual. Mix them to balance your look!"
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    greeting: {
        fontSize: 16,
        color: '#64748b',
    },
    username: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    logoutButton: {
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    actionCard: {
        width: '47%',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    tipCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#eab308',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tipText: {
        fontSize: 15,
        color: '#475569',
        fontStyle: 'italic',
        lineHeight: 22,
    },
});
