import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
    SafeAreaView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ShieldCheck } from 'lucide-react-native';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, authError } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const success = await login(email, password);
        if (!success) {
            Alert.alert('Login Failed', authError || 'Please check your credentials and try again.');
        }
    };

    const KeyboardContainer = Platform.OS === 'ios' ? KeyboardAvoidingView : View;
    const keyboardContainerProps = Platform.OS === 'ios'
        ? { behavior: 'padding', keyboardVerticalOffset: 20 }
        : {};

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardContainer
                style={styles.container}
                {...keyboardContainerProps}
            >
                <View style={styles.headerDecoration} pointerEvents="none">
                    <View style={styles.circle1} />
                    <View style={styles.circle2} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode="none"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.inner}>
                        <View style={styles.logoContainer}>
                            <View style={styles.iconWrapper}>
                                <ShieldCheck size={60} color="#fff" strokeWidth={1.5} />
                            </View>
                            <Text style={styles.title}>Security Portal</Text>
                            <Text style={styles.subtitle}>Enter your credentials to continue</Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.inputContainer}>
                                <Mail size={20} color="#8E8E93" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email Address"
                                    placeholderTextColor="#8E8E93"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    textContentType="emailAddress"
                                    autoComplete="email"
                                    showSoftInputOnFocus
                                    returnKeyType="next"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Lock size={20} color="#8E8E93" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="#8E8E93"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    textContentType="password"
                                    autoComplete="password"
                                    showSoftInputOnFocus
                                    returnKeyType="done"
                                    onSubmitEditing={handleLogin}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleLogin}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Secure Login</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardContainer>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    headerDecoration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        overflow: 'hidden',
        zIndex: 0,
    },
    circle1: {
        position: 'absolute',
        top: -100,
        right: -50,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
    },
    circle2: {
        position: 'absolute',
        top: 50,
        left: -100,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(0, 122, 255, 0.05)',
    },
    inner: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        zIndex: 1,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    formContainer: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: 'transparent',
        paddingHorizontal: 16,
        height: 60,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1E293B',
        height: '100%',
    },
    button: {
        backgroundColor: '#007AFF',
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});

export default LoginScreen;
