import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Platform,
    Alert,
    Keyboard
} from 'react-native';
import { securityService, buildImageUrl } from '../services/api';
import { Search, ChevronLeft, CheckCircle2, Navigation2, XCircle } from 'lucide-react-native';
import { format } from 'date-fns';

const SearchScreen = ({ navigation }) => {
    const [query, setQuery] = useState('');
    const [foundPass, setFoundPass] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const safeFormatDate = (dateString, formatStr) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return !isNaN(date.getTime()) ? format(date, formatStr) : 'N/A';
    };

    const handleSearch = async () => {
        if (!query.trim()) {
            setError('Please enter a Roll Number or Name');
            return;
        }

        Keyboard.dismiss();
        setIsLoading(true);
        setError(null);
        setFoundPass(null);

        try {
            const normalizedQuery = query.trim().toLowerCase();
            const passes = await securityService.getApprovedPasses();
            const matchedPass = passes.find((pass) => {
                const name = (pass.Student?.User?.name || '').toLowerCase();
                const rollNo = (pass.Student?.roll_no || '').toLowerCase();
                const passId = (pass.gatepass_id || '').toString().toLowerCase();
                return name.includes(normalizedQuery) || rollNo.includes(normalizedQuery) || passId.includes(normalizedQuery);
            });

            if (matchedPass) {
                setFoundPass(matchedPass);
            } else {
                setError(`No approved pass found for "${query}"`);
            }
        } catch (err) {
            const message = err?.response?.data?.message || 'Error searching for student';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async () => {
        if (!foundPass) return;

        const isOut = foundPass.SecurityLog && foundPass.SecurityLog.actual_out;
        const action = isOut ? 'Mark IN' : 'Mark OUT';

        setIsLoading(true);
        try {
            if (isOut) {
                await securityService.markStudentIn(foundPass.gatepass_id);
            } else {
                await securityService.markStudentOut(foundPass.gatepass_id);
            }
            Alert.alert('Success', `Student marked ${isOut ? 'IN' : 'OUT'} successfully`);
            setFoundPass(null);
            setQuery('');
        } catch (error) {
            const message = error?.response?.data?.message || `Failed to ${action}`;
            Alert.alert('Error', message);
        } finally {
            setIsLoading(false);
        }
    };
    const profileImageUrl = buildImageUrl(foundPass?.Student?.profile_pic);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Search Pass</Text>
            </View>

            <View style={styles.searchSection}>
                <View style={styles.searchBox}>
                    <Search size={20} color="#8E8E93" style={styles.searchIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Scan or Enter ID/Name..."
                        placeholderTextColor="#8E8E93"
                        value={query}
                        onChangeText={(text) => {
                            setQuery(text);
                            setError(null);
                        }}
                        autoFocus
                        returnKeyType="search"
                        onSubmitEditing={handleSearch}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
                            <XCircle size={18} color="#8E8E93" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.8}>
                    <Text style={styles.searchBtnText}>Find</Text>
                </TouchableOpacity>
            </View>

            {error ? (
                <View style={styles.errorContainer}>
                    <View style={styles.errorIcon}>
                        <Search size={32} color="#FF3B30" />
                    </View>
                    <Text style={styles.errorText}>{error}</Text>
                    <Text style={styles.errorSubtext}>Check the spelling or try a different ID</Text>
                </View>
            ) : null}

            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Searching directory...</Text>
                </View>
            )}

            {foundPass && !isLoading && (
                <View style={styles.resultContainer}>
                    <View style={styles.cardHeader}>
                        <View style={styles.statusPill}>
                            <CheckCircle2 color="#4CD964" size={16} style={{ marginRight: 6 }} />
                            <Text style={styles.statusPillText}>Pass Verified</Text>
                        </View>
                    </View>

                    <View style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={profileImageUrl ? { uri: profileImageUrl } : require('../../assets/adaptive-icon.png')}
                                style={styles.avatar}
                                defaultSource={require('../../assets/adaptive-icon.png')}
                            />
                        </View>
                        <Text style={styles.name}>{foundPass.Student?.User?.name || 'Unknown Student'}</Text>
                        <Text style={styles.rollNo}>{foundPass.Student?.roll_no || 'N/A'} • {foundPass.Student?.Department?.dept_name || 'N/A'}</Text>
                    </View>

                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Parent Contact</Text>
                            <Text style={styles.detailValue}>{foundPass.Student?.parent_phone || 'N/A'}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Current Status</Text>
                            {foundPass.SecurityLog?.actual_out ? (
                                <Text style={[styles.detailValue, { color: '#FF3B30', fontWeight: 'bold' }]}>
                                    OUT ({safeFormatDate(foundPass.SecurityLog.actual_out, 'h:mm a')})
                                </Text>
                            ) : (
                                <Text style={[styles.detailValue, { color: '#4CD964', fontWeight: 'bold' }]}>
                                    READY TO LEAVE
                                </Text>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.mainButton, { backgroundColor: foundPass.SecurityLog?.actual_out ? '#4CD964' : '#007AFF' }]}
                        onPress={handleAction}
                        activeOpacity={0.8}
                    >
                        <Navigation2 color="#fff" size={20} style={{ marginRight: 8 }} />
                        <Text style={styles.buttonText}>
                            {foundPass.SecurityLog?.actual_out ? 'MARK STUDENT IN' : 'MARK STUDENT OUT'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    backButton: {
        marginRight: 15,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
    },
    searchSection: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 2,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
        marginRight: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#1E293B',
    },
    clearBtn: {
        padding: 5,
    },
    searchBtn: {
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderRadius: 12,
        height: 50,
    },
    searchBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    errorContainer: {
        alignItems: 'center',
        padding: 40,
    },
    errorIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    errorText: {
        color: '#1E293B',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    errorSubtext: {
        color: '#64748B',
        fontSize: 14,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#64748B',
        fontSize: 15,
    },
    resultContainer: {
        margin: 20,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 217, 100, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusPillText: {
        color: '#4CD964',
        fontWeight: 'bold',
        fontSize: 14,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarContainer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#fff',
        backgroundColor: '#F1F5F9',
    },
    name: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 4,
    },
    rollNo: {
        fontSize: 15,
        color: '#64748B',
        fontWeight: '500',
    },
    detailsGrid: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        gap: 16,
    },
    detailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '600',
    },
    mainButton: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});

export default SearchScreen;
