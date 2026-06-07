import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { Screen, Heading, Subtext, Label, Input, Button, HeroCard } from '@/components/ui';
import { colors } from '@fit-n-fatal/utils';

export default function LoginScreen() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      Alert.alert('Login failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/(tabs)');
    } catch (e: unknown) {
      Alert.alert('Google sign-in failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ marginTop: 40, marginBottom: 24 }}>
            <Text style={{ fontFamily: 'Syne', fontSize: 28, color: colors.text }}>
              Fit N <Text style={{ color: colors.violet }}>Fatal</Text>
            </Text>
            <Subtext>Train hard. Track harder.</Subtext>
          </View>

          <HeroCard title="Dark · Purple · Deadly" subtitle="Your strength journey starts here" />

          <Label>Email</Label>
          <Input value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" />

          <Label>Password</Label>
          <Input value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

          <View style={{ marginTop: 24 }}>
            <Button title="Sign In" onPress={handleLogin} loading={loading} />
          </View>

          <View style={{ marginTop: 12 }}>
            <Button title="Continue with Google" onPress={handleGoogle} variant="secondary" loading={loading} />
          </View>

          <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }}>
            <Link href="/(auth)/signup">
              <Text style={{ color: colors.violet, fontFamily: 'DMSans', fontSize: 14 }}>
                Don't have an account? <Text style={{ fontWeight: '600' }}>Sign up</Text>
              </Text>
            </Link>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
