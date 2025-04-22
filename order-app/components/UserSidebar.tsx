import React, { useEffect, useRef } from 'react';
import { Modal, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function UserSidebar({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const translateX = useRef(new Animated.Value(250)).current; // 侧边栏初始在屏幕外（右侧）
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // 进入动画：侧边栏从右滑入，overlay渐变显示
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateX, overlayOpacity]);

  // 退出动画：侧边栏从左到右滑出，overlay渐变消失
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 250,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // 点击退出登录项时，执行登出逻辑并跳转到登录界面，同时标记为登出状态
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // 如果你有使用 AuthContext，请在这里更新用户状态（例如：setUser(null)）
    router.replace('/login');
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.sidebar, { transform: [{ translateX }] }]}>
              <Text style={styles.title}>👤 用户信息</Text>
              <Text style={styles.item}>查看资料</Text>
              <Text style={styles.item}>设置</Text>
              <TouchableOpacity onPress={handleLogout}>
                <Text style={styles.item}>退出登录</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  sidebar: {
    width: 250,
    backgroundColor: 'white',
    padding: 20,
    elevation: 5,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 16,
  },
  item: {
    paddingVertical: 10,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
});