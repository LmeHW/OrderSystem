// app/login.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage('请输入邮箱和密码');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage("登录失败，请检查邮箱和密码");
        await supabase.auth.signOut();
      } else {
        setMessage('登录成功！');
        // Let AuthGate handle the navigation
        router.replace('/(tabs)'); // Uncomment if you want to handle navigation here
      }
    } catch (err) {
      
      setMessage('登录失败，请稍后再试');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setMessage('请输入邮箱和密码');
      return;
    }
    
    if (password.length < 6) {
      setMessage('密码长度需至少6位');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('📩 注册成功，请前往邮箱验证！');
      }
    } catch (err) {
      setMessage('注册失败，请稍后再试');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Text style={styles.title}>欢迎使用订单系统</Text>
      <Text style={styles.subtitle}>请先登录 / 注册</Text>

      <View style={styles.formContainer}>
        <TextInput
          placeholder="邮箱"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          value={email}
          editable={!loading}
        />
        
        <TextInput
          placeholder="密码"
          style={styles.input}
          secureTextEntry
          onChangeText={setPassword}
          value={password}
          editable={!loading}
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.disabledButton]} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? '登录中...' : '登录'}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton, loading && styles.disabledButton]} 
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: '#333' }]}>{loading ? '处理中...' : '注册'}</Text>
        </TouchableOpacity>

        {message !== '' && (
          <Text style={[
            styles.message, 
            message.includes('成功') ? styles.successMessage : styles.errorMessage
          ]}>
            {message}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  input: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: 'rgba(0, 94, 255, 0.75)',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#e0e0e0',
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
    padding: 10,
    borderRadius: 6,
  },
  errorMessage: {
    color: '#d32f2f',
    backgroundColor: '#ffebee',
  },
  successMessage: {
    color: '#388e3c',
    backgroundColor: '#e8f5e9',
  }
});