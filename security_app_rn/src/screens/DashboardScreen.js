import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { securityService } from '../services/api';
import { LogOut, RefreshCw, Search, ArrowRight, Filter } from 'lucide-react-native';

const DashboardScreen = ({ navigation }) => {
    const { logout } = useAuth();
    const [passes, setPasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('ALL');
    const [selectedYear, setSelectedYear] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [sortBy, setSortBy] = useState('NEWEST');

    const fetchPasses = useCallback(async () => {
        try {
            const data = await securityService.getApprovedPasses();
            setPasses(data);
        } catch (error) {
            const message = error?.response?.data?.message || 'Failed to load approved passes';
            Alert.alert('Error', message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPasses();
    }, [fetchPasses]);

    const departmentOptions = ['ALL', ...new Set(
        passes
            .map((pass) => pass.Student?.Department?.dept_name)
            .filter(Boolean)
    )];

    const yearOptions = ['ALL', ...new Set(
        passes
            .map((pass) => pass.Student?.year)
            .filter((year) => year !== null && year !== undefined)
            .map((year) => year.toString())
    )].sort((a, b) => {
        if (a === 'ALL') return -1;
        if (b === 'ALL') return 1;
        return Number(a) - Number(b);
    });

    useEffect(() => {
        if (!departmentOptions.includes(selectedDepartment)) {
            setSelectedDepartment('ALL');
        }
        if (!yearOptions.includes(selectedYear)) {
            setSelectedYear('ALL');
        }
    }, [departmentOptions, yearOptions, selectedDepartment, selectedYear]);

    const previewPasses = passes.filter((pass) => {
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
    });

    const outCount = previewPasses.filter((pass) => pass.SecurityLog?.actual_out).length;
    const readyCount = previewPasses.length - outCount;

    const renderFilterButton = (label, isSelected, onPress) => (
        <TouchableOpacity
            key={label}
            style={[styles.filterButton, isSelected && styles.filterButtonActive]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextActive]}>{label}</Text>
        </TouchableOpacity>
    );

    const getOptionCount = (type, option) => {
        if (option === 'ALL') return passes.length;
        return passes.filter((pass) => {
            const student = pass.Student || {};
            if (type === 'department') return (student.Department?.dept_name || '') === option;
            if (type === 'year') return (student.year?.toString() || '') === option;
            return false;
        }).length;
    };

    const openFilteredDashboard = () => {
        navigation.navigate('FilteredDashboard', {
            searchQuery,
            selectedDepartment,
            selectedYear,
            selectedStatus,
            sortBy
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.mainHeader}>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.greeting}>Campus Gate Management</Text>
                    <Text style={styles.headerTitle}>Filter Dashboard</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={fetchPasses} style={styles.headerIconBtn}>
                        <RefreshCw size={20} color="#1D4ED8" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={logout} style={[styles.headerIconBtn, { backgroundColor: '#FEE2E2' }]}>
                        <LogOut size={20} color="#DC2626" />
                    </TouchableOpacity>
                </View>
            </View>

            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading filter data...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.searchContainer}>
                        <Search size={18} color="#64748B" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search Name or Roll Number..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#94A3B8"
                        />
                    </View>

                    <View style={styles.quickActions}>
                        <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Search')}>
                            <Search size={16} color="#0F172A" />
                            <Text style={styles.quickBtnText}>Quick Find Student</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statRow}>
                        <View style={[styles.statCard, styles.statCardPrimary]}>
                            <Text style={styles.statNumber}>{previewPasses.length}</Text>
                            <Text style={styles.statLabel}>Matching</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statNumber, { color: '#16A34A' }]}>{readyCount}</Text>
                            <Text style={styles.statLabel}>Ready</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statNumber, { color: '#DC2626' }]}>{outCount}</Text>
                            <Text style={styles.statLabel}>Outside</Text>
                        </View>
                    </View>

                    <View style={styles.filterCard}>
                        <View style={styles.filterTitleRow}>
                            <Filter size={16} color="#0F172A" />
                            <Text style={styles.filterTitle}>Department</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
                            {departmentOptions.map((dept) => renderFilterButton(
                                `${dept}${dept !== 'ALL' ? ` (${getOptionCount('department', dept)})` : ''}`,
                                selectedDepartment === dept,
                                () => setSelectedDepartment(dept)
                            ))}
                        </ScrollView>

                        <Text style={styles.filterSubTitle}>Year</Text>
                        <View style={styles.filterWrapRow}>
                            {yearOptions.map((year) => renderFilterButton(
                                `${year === 'ALL' ? 'ALL' : `YEAR ${year}`}${year !== 'ALL' ? ` (${getOptionCount('year', year)})` : ''}`,
                                selectedYear === year,
                                () => setSelectedYear(year)
                            ))}
                        </View>

                        <Text style={styles.filterSubTitle}>Status</Text>
                        <View style={styles.filterWrapRow}>
                            {renderFilterButton('ALL', selectedStatus === 'ALL', () => setSelectedStatus('ALL'))}
                            {renderFilterButton('READY', selectedStatus === 'READY', () => setSelectedStatus('READY'))}
                            {renderFilterButton('OUTSIDE', selectedStatus === 'OUTSIDE', () => setSelectedStatus('OUTSIDE'))}
                        </View>

                        <Text style={styles.filterSubTitle}>Sort</Text>
                        <View style={styles.sortSegment}>
                            <TouchableOpacity
                                style={[styles.sortBtn, sortBy === 'NEWEST' && styles.sortBtnActive]}
                                onPress={() => setSortBy('NEWEST')}
                            >
                                <Text style={[styles.sortBtnText, sortBy === 'NEWEST' && styles.sortBtnTextActive]}>Newest</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.sortBtn, sortBy === 'OLDEST' && styles.sortBtnActive]}
                                onPress={() => setSortBy('OLDEST')}
                            >
                                <Text style={[styles.sortBtnText, sortBy === 'OLDEST' && styles.sortBtnTextActive]}>Oldest</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.mainActionBtn} onPress={openFilteredDashboard} activeOpacity={0.85}>
                        <Text style={styles.mainActionText}>View Filtered Dashboard ({previewPasses.length})</Text>
                        <ArrowRight size={20} color="#fff" />
                    </TouchableOpacity>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EEF2F7',
    },
    mainHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Platform.OS === 'android' ? 18 : 10,
        marginHorizontal: 14,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 14,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    headerTextWrap: {
        flex: 1,
    },
    greeting: {
        fontSize: 12,
        color: '#1D4ED8',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 10,
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    scrollContent: {
        padding: 14,
        paddingBottom: 30,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 52,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#0F172A',
    },
    quickActions: {
        marginTop: 12,
    },
    quickBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    quickBtnText: {
        color: '#1E3A8A',
        fontSize: 13,
        fontWeight: '700',
    },
    statRow: {
        marginTop: 14,
        flexDirection: 'row',
        gap: 10,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statCardPrimary: {
        backgroundColor: '#DBEAFE',
    },
    statNumber: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1D4ED8',
    },
    statLabel: {
        marginTop: 2,
        fontSize: 11,
        color: '#334155',
        fontWeight: '700',
    },
    filterCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginTop: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    filterTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    filterTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
    },
    filterSubTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 8,
        marginBottom: 8,
    },
    filterScrollContent: {
        paddingVertical: 2,
        paddingRight: 10,
    },
    filterWrapRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    filterButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    filterButtonActive: {
        backgroundColor: '#1D4ED8',
        borderColor: '#1D4ED8',
    },
    filterButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#334155',
    },
    filterButtonTextActive: {
        color: '#fff',
    },
    sortSegment: {
        flexDirection: 'row',
        borderRadius: 10,
        backgroundColor: '#E2E8F0',
        padding: 3,
        alignSelf: 'flex-start',
    },
    sortBtn: {
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    sortBtnActive: {
        backgroundColor: '#0F172A',
    },
    sortBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#334155',
    },
    sortBtnTextActive: {
        color: '#F8FAFC',
    },
    mainActionBtn: {
        marginTop: 16,
        backgroundColor: '#0F172A',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    mainActionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
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
});

export default DashboardScreen;
