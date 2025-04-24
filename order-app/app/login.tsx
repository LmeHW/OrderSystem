// app/login.tsx
import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Animated, Easing } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import * as Animatable from 'react-native-animatable'; // 使用 Animatable 作为 React Native 版本的 Anime.js
import YourLogo from '@/components/svgs/logo';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);

  // 创建动画值引用
  const titleFade = useRef(new Animated.Value(0)).current;
  const formSlideUp = useRef(new Animated.Value(50)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  
  // Logo旋转动画
  const rotation = useRef(new Animated.Value(0)).current;
  const rotationInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // 标题波浪动画
  const titleShimmer = useRef(new Animated.Value(0)).current;
  const titleWave = useRef(new Animated.Value(0)).current;
  const titleLetters = "OrderGear".split('');

  useEffect(() => {
    // 进入动画序列
    Animated.sequence([
      // 1. 标题淡入
      Animated.timing(titleFade, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      // 2. 表单上滑并淡入
      Animated.parallel([
        Animated.timing(formSlideUp, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic)
        }),
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true
        })
      ])
    ]).start(() => setIsFormVisible(true));

    // 循环旋转Logo
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();

     // 添加标题的光泽动画
     Animated.loop(
      Animated.timing(titleShimmer, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
        easing: Easing.linear
      })
    ).start();
    
    // 添加波浪效果
    Animated.loop(
      Animated.timing(titleWave, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
        easing: Easing.linear
      })
    ).start();
  }, []);

  // 输入框动画引用 with correct types
  const emailInputRef = useRef<Animatable.View & { shake: (duration?: number) => void; bounce: (duration?: number) => void }>(null);
  const passwordInputRef = useRef<Animatable.View & { shake: (duration?: number) => void; bounce: (duration?: number) => void }>(null);
  const loginButtonRef = useRef<Animatable.View & { pulse: (duration?: number) => void }>(null);
  const signupButtonRef = useRef<Animatable.View & { pulse: (duration?: number) => void }>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      if (!email && !password) {
        setMessage('请输入邮箱和密码');
        shakeForm();
        return;
      } else if (!email) {
        setMessage('请输入邮箱地址');
        emailInputRef.current?.shake(800);
        return;
      } else if (!password) {
        if (!/\S+@\S+\.\S+/.test(email)) {
          setMessage('请输入有效的邮箱地址');
          emailInputRef.current?.shake(800);
          return;
        }
        setMessage('请输入密码');
        passwordInputRef.current?.shake(800);
        return;
      }
    }

    
    setLoading(true);
    setMessage('');
    
    // 登录按钮按下动画
    loginButtonRef.current?.pulse(400);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage("登录失败，请检查邮箱和密码");
        shakeForm();
        await supabase.auth.signOut();
      } else {
        setMessage('登录成功！');
        
        // 成功动画
        Animated.sequence([
          Animated.parallel([
            Animated.timing(formOpacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true
            }),
            Animated.timing(formSlideUp, {
              toValue: -50,
              duration: 500,
              useNativeDriver: true
            })
          ])
        ]).start(() => {
          router.replace('/(tabs)');
        });
      }
    } catch (err) {
      setMessage('登录失败，请稍后再试');
      shakeForm();
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setMessage('请输入邮箱和密码');
      shakeForm();
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setMessage('请输入有效的邮箱地址');
      emailInputRef.current?.shake(800);
      return;
    }
    
    if (password.length < 6) {
      setMessage('密码长度需至少6位');
      passwordInputRef.current?.shake(800);
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    // 注册按钮按下动画
    signupButtonRef.current?.pulse(400);
    
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
        shakeForm();
      } else {
        setMessage('📩 注册成功，请前往邮箱验证！');
        // 成功动画
        emailInputRef.current?.bounce(800);
        passwordInputRef.current?.bounce(800);
      }
    } catch (err) {
      setMessage('注册失败，请稍后再试');
      shakeForm();
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 表单摇晃动画（失败时）
  const shakeForm = () => {
    emailInputRef.current?.shake(800);
    passwordInputRef.current?.shake(800);
  };


  // 创建渐变移动效果
  const shimmerTranslate = titleShimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 250]
  });
  // 创建3D效果的标题
  const renderFancyTitle = () => {
    // 选择要使用的风格 - 取消注释你想要的风格
    
    // 风格1: 3D文字跳动效果
    /*
    return (
      <View style={styles.titleContainer}>
        {titleLetters.map((letter, index) => {
          const translateY = titleWave.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, -10, 0],
            // 为每个字母添加延迟
            extrapolate: 'clamp'
          });

          return (
            <Animated.Text 
              key={index} 
              style={[
                styles.titleText,
                { 
                  transform: [{ 
                    translateY: Animated.add(
                      translateY, 
                      new Animated.Value(Math.sin(index / titleLetters.length * Math.PI) * 5)
                    ) 
                  }],
                  textShadowColor: 'rgba(0, 94, 255, 0.4)',
                  textShadowOffset: { width: 0, height: 4 },
                  textShadowRadius: 10,
                }
              ]}
            >
              {letter}
            </Animated.Text>
          );
        })}
      </View>
    );
    */
    
    
    // 风格3: 霓虹灯效果

    return (
      <View style={styles.titleContainer}>
        <Text style={[styles.titleNeon, styles.titleNeonBlur, { fontSize: 40 }]}>OrderGear</Text>
        <Text style={[styles.titleNeon, styles.titleNeonPink, { fontSize: 40 }]}>OrderGear</Text>
        <Text style={[styles.titleNeon, styles.titleNeonBlue, { fontSize: 40 }]}>OrderGear</Text>
        <Text style={[styles.titleNeon, { fontSize: 40 }]}>OrderGear</Text>
      </View>
    );
    
  };



  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      {/* 装饰性背景元素 */}
      <Animated.View style={[styles.decorCircle, styles.decorCircle1, { opacity: titleFade }]} />
      <Animated.View style={[styles.decorCircle, styles.decorCircle2, { opacity: titleFade }]} />
      
      {/* Logo和标题区域 */}
      <Animated.View style={[styles.logoContainer, { opacity: titleFade }]}>
        <Animated.View style={[styles.logoWrapper, { transform: [{ rotate: rotationInterpolate }] }]}>
          <YourLogo width={80} height={80} />
        </Animated.View>
        {/* <Text style={styles.title}>OrderGear</Text> */}

        {/* 使用高级标题替换原来的标题 */}
        {renderFancyTitle()}

        <Text style={styles.subtitle}>高效订单管理，从这里开始</Text>
      </Animated.View>
      

      {/* 表单区域 */}
      <Animated.View 
        style={[
          styles.formContainer, 
          { 
            opacity: formOpacity,
            transform: [{ translateY: formSlideUp }]
          }
        ]}
      >
        <Animatable.View ref={emailInputRef} style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>邮箱</Text>
          <TextInput
            placeholder="请输入您的邮箱地址"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            value={email}
            editable={!loading}
          />
        </Animatable.View>
        
        <Animatable.View ref={passwordInputRef} style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>密码</Text>
          <TextInput
            placeholder="请输入您的密码"
            style={styles.input}
            secureTextEntry
            onChangeText={setPassword}
            value={password}
            editable={!loading}
          />
        </Animatable.View>

        <Animatable.View ref={loginButtonRef}>
          <TouchableOpacity 
            style={[styles.button, loading && styles.disabledButton]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? '登录中...' : '登录'}</Text>
          </TouchableOpacity>
        </Animatable.View>

        <Animatable.View ref={signupButtonRef}>
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, loading && styles.disabledButton]} 
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: '#333' }]}>{loading ? '处理中...' : '注册'}</Text>
          </TouchableOpacity>
        </Animatable.View>

        {message !== '' && (
          <Animatable.Text 
            animation="fadeIn" 
            duration={500}
            style={[
              styles.message, 
              message.includes('成功') ? styles.successMessage : styles.errorMessage
            ]}
          >
            {message}
          </Animatable.Text>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    overflow: 'hidden',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 94, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
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
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  button: {
    backgroundColor: 'rgba(0, 94, 255, 0.85)',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderRadius: 8,
  },
  errorMessage: {
    color: '#d32f2f',
    backgroundColor: '#ffebee',
  },
  successMessage: {
    color: '#388e3c',
    backgroundColor: '#e8f5e9',
  },
  // 装饰性背景元素
  decorCircle: {
    position: 'absolute',
    borderRadius: 150,
    opacity: 0.05,
  },
  decorCircle1: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(0, 94, 255, 0.5)',
    top: -100,
    right: -100,
  },
  decorCircle2: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(0, 94, 255, 0.3)',
    bottom: -50,
    left: -50,
  },
  logoWrapper: {
    transform: [{ rotate: '0deg' }],
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginBottom: 6,
    position: 'relative',
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 1,
  },
  titleShadow: {
    position: 'absolute',
    textShadowColor: 'rgba(0, 94, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    color: 'transparent',
  },
  // 霓虹灯效果样式
  titleNeon: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    position: 'absolute',
    alignSelf: 'center',
  },
  titleNeonBlur: {
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    color: 'transparent',
  },
  titleNeonPink: {
    textShadowColor: 'rgba(255, 36, 145, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    color: 'transparent',
  },
  titleNeonBlue: {
    textShadowColor: 'rgba(56, 182, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    color: 'transparent',
  },
});