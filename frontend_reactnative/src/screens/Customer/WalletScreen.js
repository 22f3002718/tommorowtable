import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getWalletBalance,
  getWalletTransactions,
  addMoneyToWallet,
} from '../../services/api';

export default function WalletScreen({ navigation }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [balanceData, transactionsData] = await Promise.all([
        getWalletBalance(),
        getWalletTransactions(),
      ]);
      setBalance(balanceData.balance);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    }
  };

  const handleAddMoney = async () => {
    const amountValue = parseFloat(amount);
    if (!amountValue || amountValue <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      await addMoneyToWallet(amountValue);
      Alert.alert('Success', `₹${amountValue.toFixed(2)} added to your wallet`);
      setAmount('');
      await fetchWalletData();
    } catch (error) {
      console.error('Error adding money:', error);
      Alert.alert('Error', 'Failed to add money to wallet');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100, 500, 1000, 2000];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <View
        style={[
          styles.transactionIcon,
          { backgroundColor: item.type === 'deposit' ? '#D1FAE5' : '#FEE2E2' },
        ]}
      >
        <Icon
          name={item.type === 'deposit' ? 'plus' : 'minus'}
          size={16}
          color={item.type === 'deposit' ? '#10B981' : '#EF4444'}
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionType}>
          {item.type === 'deposit' ? 'Money Added' : item.type === 'debit' ? 'Order Payment' : 'Refund'}
        </Text>
        <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          { color: item.type === 'deposit' ? '#10B981' : '#EF4444' },
        ]}
      >
        {item.type === 'deposit' ? '+' : '-'}₹{item.amount.toFixed(2)}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <LinearGradient colors={['#F97316', '#DC2626']} style={styles.balanceGradient}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
        </LinearGradient>
      </View>

      {/* Add Money Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Money</Text>
        
        {/* Mock Mode Notice */}
        <View style={styles.noticeBox}>
          <Icon name="information" size={16} color="#3B82F6" />
          <Text style={styles.noticeText}>
            Demo Mode: Money will be added instantly without payment gateway
          </Text>
        </View>

        <TextInput
          style={styles.amountInput}
          placeholder="Enter amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <View style={styles.quickAmounts}>
          {quickAmounts.map((quickAmount) => (
            <TouchableOpacity
              key={quickAmount}
              style={styles.quickAmountButton}
              onPress={() => setAmount(quickAmount.toString())}
            >
              <Text style={styles.quickAmountText}>₹{quickAmount}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.addMoneyButton}
          onPress={handleAddMoney}
          disabled={loading}
        >
          <LinearGradient
            colors={['#F97316', '#DC2626']}
            style={styles.addMoneyGradient}
          >
            <Text style={styles.addMoneyText}>
              {loading ? 'Adding...' : 'Add Money'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="receipt" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          <FlatList
            data={transactions.slice(0, 10)}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  balanceCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  balanceGradient: {
    padding: 30,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: 8,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  addMoneyButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  addMoneyGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  addMoneyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
});