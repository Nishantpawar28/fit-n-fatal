import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { Screen, Subtext, Label, Input, Button } from '@/components/ui';
import { colors } from '@fit-n-fatal/utils';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password);
      Alert.alert('Success', 'Check your email to confirm your account, then sign in.');
      router.replace('/(auth)/login');
    } catch (e: unknown) {
      Alert.alert('Signup failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ marginTop: 40, marginBottom: 32 }}>
            <Text style={{ fontFamily: 'Syne', fontSize: 28, color: colors.text }}>
              Join <Text style={{ color: colors.violet }}>Fatal</Text>
            </Text>
            <Subtext>Create your account and start logging</Subtext>
          </View>

          <Label>Email</Label>
          <Input value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" />

          <Label>Password</Label>
          <Input value={password} onChangeText={setPassword} placeholder="Min 6 characters" secureTextEntry />

          <Label>Confirm Password</Label>
          <Input value={confirm} onChangeText={setConfirm} placeholder="Repeat password" secureTextEntry />

          <View style={{ marginTop: 24 }}>
            <Button title="Create Account" onPress={handleSignup} loading={loading} />
          </View>

          <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }}>
            <Link href="/(auth)/login">
              <Text style={{ color: colors.violet, fontFamily: 'DMSans', fontSize: 14 }}>
                Already have an account? <Text style={{ fontWeight: '600' }}>Sign in</Text>
              </Text>
            </Link>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
