import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Alert,
    RefreshControl,
    SafeAreaView,
    Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { securityService, buildImageUrl } from '../services/api';
import { ChevronLeft, LogOut, RefreshCw, Phone, MapPin, Clock, Search } from 'lucide-react-native';
import { format } from 'date-fns';

const FilteredDashboardScreen = ({ navigation, route }) => {
    const { logout } = useAuth();
    const [passes, setPasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const {
        searchQuery: initialSearchQuery = '',
        selectedDepartment = 'ALL',
        selectedYear = 'ALL',
        selectedStatus = 'ALL',
        sortBy = 'NEWEST'
    } = route.params || {};
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

    const safeFormatDate = (dateString, formatStr) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return !isNaN(date.getTime()) ? format(date, formatStr) : 'N/A';
    };

    const fetchPasses = useCallback(async () => {
        try {
            const data = await securityService.getApprovedPasses();
            setPasses(data);
        } catch (error) {
            const message = error?.response?.data?.message || 'Failed to load approved passes';
            Alert.alert('Error', message);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchPasses();
    }, [fetchPasses]);

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchPasses();
    };

    const handleAction = async (pass) => {
        const isOut = !!pass.SecurityLog?.actual_out;
        const action = isOut ? 'Mark IN' : 'Mark OUT';

        try {
            if (isOut) {
                await securityService.markStudentIn(pass.gatepass_id);
            } else {
                await securityService.markStudentOut(pass.gatepass_id);
            }
            Alert.alert('Success', `Student marked ${isOut ? 'IN' : 'OUT'} successfully`);
            fetchPasses();
        } catch (error) {
            const message = error?.response?.data?.message || `Failed to ${action}`;
            Alert.alert('Error', message);
        }
    };

    const filteredPasses = passes.filter((pass) => {
        const name = (pass.Student?.User?.name || '').toLowerCase();
        const rollNo = (pass.Student?.roll_no || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        const department = pass.Student?.Department?.dept_name || '';
        const year = pass.Student?.year?.toString() || '';
        const isOut = !!pass.SecurityLog?.actual_out;

        const matchesSearch = name.includes(query) || rollNo.includes(query);
        const matchesDepartment = selectedDepartment === 'ALL' || department === selectedDepartment;
        const matchesYear = selectedYear === 'ALL' || year === selectedYear;
        const matchesStatus = selectedStatus === 'ALL'
            || (selectedStatus === 'READY' && !isOut)
            || (selectedStatus === 'OUTSIDE' && isOut);

        return matchesSearch && matchesDepartment && matchesYear && matchesStatus;
    }).sort((a, b) => {
        const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
        const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
        return sortBy === 'NEWEST' ? bTime - aTime : aTime - bTime;
    });

    const renderPassItem = ({ item }) => {
        const isOut = !!item.SecurityLog?.actual_out;
        const student = item.Student || {};
        const user = student.User || {};
        const profileImageUrl = buildImageUrl(student.profile_pic);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.studentInfoBasic}>
                        <Image
                            source={profileImageUrl ? { uri: profileImageUrl } : require('../../assets/adaptive-icon.png')}
                            style={styles.avatar}
                            defaultSource={require('../../assets/adaptive-icon.png')}
                        />
                        <View style={styles.nameContainer}>
                            <Text style={styles.name}>{user.name || 'Unknown Student'}</Text>
                            <Text style={styles.rollNo}>{student.roll_no || 'N/A Roll Number'}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, isOut ? styles.statusOut : styles.statusReady]}>
                        <Text style={[styles.statusText, { color: isOut ? '#FF3B30' : '#4CD964' }]}>
                            {isOut ? 'OUT' : 'READY'}
                        </Text>
                    </View>
                </View>

                <View style={styles.metaRow}>
                    <View style={styles.metaPill}>
                        <MapPin size={14} color="#0369A1" />
                        <Text style={styles.metaPillText}>{student.Department?.dept_name || 'Department N/A'}</Text>
                    </View>
                    <View style={styles.metaPill}>
                        <Text style={styles.metaPillText}>Year {student.year || 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Parent:</Text>
                        <Phone size={15} color="#64748B" />
                        <Text style={styles.infoText}>{student.parent_phone || 'No Contact'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Planned Out:</Text>
                        <Clock size={15} color="#64748B" />
                        <Text style={styles.infoText}>{safeFormatDate(item.out_time, 'MMM d, h:mm a')}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.actionButton, isOut ? styles.actionIn : styles.actionOut]}
                    onPress={() => handleAction(item)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.actionText}>{isOut ? 'MARK STUDENT IN' : 'MARK STUDENT OUT'}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeft size={22} color="#0F172A" />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>Filtered Dashboard</Text>
                    <Text style={styles.headerSub}>{filteredPasses.length} passes found</Text>
                </View>
                <TouchableOpacity onPress={onRefresh} style={styles.headerIconBtn}>
                    <RefreshCw size={20} color="#1D4ED8" />
                </TouchableOpacity>
                <TouchableOpacity onPress={logout} style={[styles.headerIconBtn, { backgroundColor: '#FEE2E2' }]}>
                    <LogOut size={20} color="#DC2626" />
                </TouchableOpacity>
            </View>

            <View style={styles.chipsRow}>
                <Text style={styles.chip}>Dept: {selectedDepartment}</Text>
                <Text style={styles.chip}>Year: {selectedYear}</Text>
                <Text style={styles.chip}>Status: {selectedStatus}</Text>
                <Text style={styles.chip}>Sort: {sortBy}</Text>
            </View>

            <View style={styles.searchContainer}>
                <Search size={18} color="#64748B" style={styles.searchIcon} />
                <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search by name or roll number..."
                    placeholderTextColor="#94A3B8"
                    style={styles.searchInput}
                />
            </View>

            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading filtered passes...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredPasses}
                    keyExtractor={(item) => item.gatepass_id.toString()}
                    renderItem={renderPassItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#007AFF']} tintColor="#007AFF" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Image source={require('../../assets/adaptive-icon.png')} style={styles.emptyImage} />
                            <Text style={styles.emptyTitle}>No Matching Passes</Text>
                            <Text style={styles.emptySubtitle}>Change filters in previous screen and try again.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('Search')}
                activeOpacity={0.9}
            >
                <Search size={24} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EEF2F7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Platform.OS === 'android' ? 18 : 10,
        marginHorizontal: 14,
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        gap: 8,
    },
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    headerSub: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    headerIconBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    chip: {
        backgroundColor: '#DBEAFE',
        color: '#1E3A8A',
        fontSize: 12,
        fontWeight: '700',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 100,
    },
    searchContainer: {
        marginHorizontal: 16,
        marginBottom: 4,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
        height: 48,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#0F172A',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    studentInfoBasic: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#F1F5F9',
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    nameContainer: {
        marginLeft: 12,
        flex: 1,
    },
    name: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    rollNo: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    statusReady: {
        backgroundColor: 'rgba(22, 163, 74, 0.12)',
    },
    statusOut: {
        backgroundColor: 'rgba(220, 38, 38, 0.12)',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    metaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0F2FE',
        borderRadius: 10,
        paddingVertical: 6,
        paddingHorizontal: 10,
        gap: 6,
    },
    metaPillText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0C4A6E',
    },
    cardBody: {
        marginBottom: 14,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 10,
        gap: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoLabel: {
        width: 92,
        fontSize: 13,
        color: '#475569',
        fontWeight: '700',
    },
    infoText: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '600',
    },
    actionButton: {
        paddingVertical: 13,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionOut: {
        backgroundColor: '#1D4ED8',
    },
    actionIn: {
        backgroundColor: '#16A34A',
    },
    actionText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
        letterSpacing: 0.5,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#334155',
        fontSize: 15,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 70,
    },
    emptyImage: {
        width: 110,
        height: 110,
        opacity: 0.35,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 30,
        backgroundColor: '#0F172A',
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    }
});

export default FilteredDashboardScreen;
