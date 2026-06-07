import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@fit-n-fatal/utils';

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Heading({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.heading, style]}>{children}</Text>;
}

export function Subtext({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.subtext, style]}>{children}</Text>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  style,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'decimal-pad';
  style?: ViewStyle;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      style={[styles.input, style]}
    />
  );
}

export function Button({
  title,
  onPress,
  loading,
  variant = 'primary',
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: ViewStyle;
}) {
  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={loading} activeOpacity={0.8} style={style}>
        <LinearGradient colors={[colors.purple, colors.violet]} style={styles.btnPrimary}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnPrimaryText}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={[
        variant === 'secondary' ? styles.btnSecondary : styles.btnGhost,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.violet} />
      ) : (
        <Text style={variant === 'secondary' ? styles.btnSecondaryText : styles.btnGhostText}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function Badge({ text, color = 'purple' }: { text: string; color?: 'purple' | 'pink' | 'neutral' }) {
  const bg =
    color === 'pink'
      ? 'rgba(255,107,170,0.2)'
      : color === 'neutral'
        ? 'rgba(255,255,255,0.07)'
        : 'rgba(139,43,255,0.2)';
  const fg = color === 'pink' ? colors.pink : color === 'neutral' ? colors.textDim : colors.violet;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{text}</Text>
    </View>
  );
}

export function HeroCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <LinearGradient colors={['#6B1FCC', '#A83BEE']} style={styles.hero}>
      <View>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSub}>{subtitle}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(180,100,255,0.12)',
    padding: 16,
    marginBottom: 12,
  },
  heading: {
    fontFamily: 'Syne',
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtext: {
    fontFamily: 'DMSans',
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
  },
  label: {
    fontFamily: 'DMSans',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(180,100,255,0.15)',
    borderRadius: 10,
    padding: 14,
    color: colors.text,
    fontFamily: 'DMSans',
    fontSize: 15,
  },
  btnPrimary: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontFamily: 'DMSans',
    fontSize: 15,
    fontWeight: '600',
  },
  btnSecondary: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(180,100,255,0.2)',
  },
  btnSecondaryText: {
    color: colors.text,
    fontFamily: 'DMSans',
    fontSize: 15,
  },
  btnGhost: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnGhostText: {
    color: colors.violet,
    fontFamily: 'DMSans',
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'DMSans',
  },
  hero: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },
  heroTitle: {
    fontFamily: 'Syne',
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  heroSub: {
    fontFamily: 'DMSans',
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 16,
  },
});
