import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/auth';

type Order = {
  id: string;
  store: string;
  amount: number;
  status: string;
  created_at: string;
  user_id: string;
  unit_price: number;
  
  };

type SortOption = 'date' | 'amount';

// 创建一个简单的内存缓存
const CACHE = {
  orders: [] as Order[],
  lastFetchTime: 0,
  stats: {
    todayOrders: 0,
    pendingOrders: 0,
    pendingPayment: 0,
    monthSales: 0,
  },
  dirty: false, // 标记数据是否需要刷新
};

// 缓存过期时间（毫秒）
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟

export default function IndexScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(CACHE.orders);
  const [loading, setLoading] = useState(!CACHE.orders.length);
  const [stats, setStats] = useState(CACHE.stats);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  // 检查缓存是否有效或需要刷新
  const isCacheValid = () => {
    const now = Date.now();
    return (
      CACHE.orders.length > 0 && 
      !CACHE.dirty && 
      now - CACHE.lastFetchTime < CACHE_EXPIRY
    );
  };

  // 计算统计数据
  const calculateStats = (ordersData: Order[]) => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const todayOrders = ordersData.filter(order => 
      order.created_at.startsWith(today)
    ).length;
    
    const pendingOrders = ordersData.filter(order => 
      order.status === 'pending'
    ).length;
    
    const pendingPayment = ordersData.filter(order => 
      order.status === 'awaiting_payment'
    ).length;
    
    const monthSales = ordersData
      .filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() + 1 === currentMonth && 
               orderDate.getFullYear() === currentYear &&
               order.status !== 'cancelled';
      })
      .reduce((total, order) => total + order.amount * order.unit_price,  0);
    

    return {
      todayOrders,
      pendingOrders,
      pendingPayment,
      monthSales,
    };
  };

  const fetchOrders = async (refresh = false) => {
    try {
      // 如果是刷新，重置页码
      if (refresh) {
        setPage(0);
        setHasMore(true);
      }
      
      setLoading(true);
      const currentPage = refresh ? 0 : page;
      

      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        console.error('User ID not found in session');
        return;
      }

      console.log('Fetching orders for user:', user.user.id);
      
      // 构建查询
      let query = supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.user?.id)
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);
      
      // 排序
      if (sortBy === 'date') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'amount') {
        query = query.order('amount', { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      const newOrders = data as Order[];
      
      // 检查是否还有更多数据
      if (newOrders.length < PAGE_SIZE) {
        setHasMore(false);
      }
      
      // 更新状态和缓存
      if (refresh || currentPage === 0) {
        setOrders(newOrders);
        CACHE.orders = newOrders;
        
        // 只在第一页计算统计数据
        const newStats = calculateStats(newOrders);
        setStats(newStats);
        CACHE.stats = newStats;
      } else {
        setOrders(prev => [...prev, ...newOrders]);
        CACHE.orders = [...CACHE.orders, ...newOrders];
      }
      
      // 更新缓存时间并重置脏标记
      CACHE.lastFetchTime = Date.now();
      CACHE.dirty = false;
      
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 处理排序变更
  useEffect(() => {
    // 只在排序改变时刷新数据
    if (CACHE.orders.length > 0) {
      CACHE.dirty = true;
      fetchOrders(true);
    }
  }, [sortBy]);

  // 首次加载并且有会话时加载数据
  useEffect(() => {
    if (session && !isCacheValid()) {
      fetchOrders(true);
    } else if (session && isCacheValid()) {
      // 使用缓存数据
      setOrders(CACHE.orders);
      setStats(CACHE.stats);
      setLoading(false);
    }
  }, [session]);

  // 页面获取焦点时检查是否需要刷新
  useFocusEffect(
    useCallback(() => {
      if (session && CACHE.dirty) {
        fetchOrders(true);
      }
      
      // 提供一个公共方法来标记数据已修改
      // 例如在创建新订单后
      (global as any).markOrdersDataDirty = () => {
        CACHE.dirty = true;
      };
      
      return () => {
        // 清理
        (global as any).markOrdersDataDirty = undefined;
      };
    }, [session])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(true);
  };

  const loadMoreOrders = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchOrders();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}  ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <Text style={styles.storeName}>{item.store}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {item.status === 'completed' ? '已完成' : 
             item.status === 'pending' ? '等待确认' : 
             item.status === 'awaiting_payment' ? '待付款' : item.status}
          </Text>
        </View>
      </View>
      
      {/* 应该修改为最后修改时间 */}
      <Text style={styles.orderCode}>
        {formatDate(item.created_at)}
      </Text>
      
      <View style={styles.orderDetails}>
        <Text style={styles.orderAmount}>¥{item.amount * item.unit_price}</Text>
        <View style={styles.orderActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>分享</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.processButton]}
            onPress={() => {
              router.push({
                pathname: '/order-detail',
                params: { id: item.id }
              } as any);
            }}
          >
            <Text style={[styles.actionButtonText, styles.processButtonText]}>处理</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>今日订单</Text>
            <Text style={styles.statValue}>{stats.todayOrders}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>未完成</Text>
            <Text style={styles.statValue}>{stats.pendingOrders}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>待收款</Text>
            <Text style={[styles.statValue, { color: 'orange' }]}>{stats.pendingPayment}</Text>
          </View>
          <TouchableOpacity
            style={styles.statBox}
            onPress={() => {
              router.push('/analysis' as any);
            }}
            >
            <Text style={styles.statLabel}>本月销售</Text>
            <Text style={styles.statValue}>¥{stats.monthSales.toLocaleString()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Order Creation Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>订单创建</Text>
        <View style={styles.createOptionsContainer}>
          <TouchableOpacity 
            style={styles.createOption}
            onPress={() => {
              router.push('/modal');
              // 标记数据需要刷新
              CACHE.dirty = true;
            }}
          >
            <MaterialIcons name="add" size={24} color="#4285F4" />
            <Text style={styles.createOptionText}>手动创建</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createOption}>
            <MaterialIcons name="photo-camera" size={24} color="#4285F4" />
            <Text style={styles.createOptionText}>拍照录单</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createOption}>
            <MaterialIcons name="mic" size={24} color="#4285F4" />
            <Text style={styles.createOptionText}>语音录单</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createOption}>
            <MaterialIcons name="table-chart" size={24} color="#4285F4" />
            <Text style={styles.createOptionText}>表格导入</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Orders Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.orderListHeader}>
          <Text style={styles.sectionTitle}>最近订单</Text>
          <TouchableOpacity onPress={() => router.push('/order-history' as any)}>
            <Text style={styles.viewAllLink}>查看全部</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.sortOptions}>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'date' && styles.activeSortButton]}
            onPress={() => setSortBy('date')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'date' && styles.activeSortText]}>
              最新订单
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'amount' && styles.activeSortButton]}
            onPress={() => setSortBy('amount')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'amount' && styles.activeSortText]}>
              按金额排序
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Order List */}
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.ordersList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          onEndReached={loadMoreOrders}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore && orders.length > 0 ? (
              <View style={styles.loadingMore}>
                <Text style={styles.loadingMoreText}>加载更多...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {loading ? '加载中...' : '暂无订单数据'}
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  createOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  createOption: {
    width: '24%',
    padding: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  createOptionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  orderListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllLink: {
    color: '#4285F4',
    fontSize: 14,
  },
  sortOptions: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  activeSortButton: {
    backgroundColor: '#e6f0ff',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
  },
  activeSortText: {
    color: '#4285F4',
    fontWeight: '500',
  },
  ordersList: {
    paddingBottom: 20,
  },
  orderItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  orderCode: {
    fontSize: 13,
    color: '#888',
    marginBottom: 10,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  orderActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  processButton: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#666',
  },
  processButtonText: {
    color: '#fff',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#888',
    fontSize: 14,
  },
  loadingMore: {
    padding: 10,
    alignItems: 'center',
  },
  loadingMoreText: {
    color: '#666',
    fontSize: 14,
  }
});