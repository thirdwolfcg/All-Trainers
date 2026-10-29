import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button, Field } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async () => {
    setBusy(true);
    setError(undefined);
    const res = await signIn(email, password);
    setBusy(false);
    if (res.error) setError(res.error);
  };

  return (
    <Screen title="Welcome back" subtitle="Your people missed you." padTop={false}>
      <View style={{ gap: Spacing.lg }}>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          error={error}
          onSubmitEditing={submit}
        />
        <Button label={busy ? 'Signing in…' : 'Sign in'} disabled={!email || !password || busy} onPress={submit} />
        <Button kind="ghost" label="New here? Create an account" onPress={() => router.replace('/sign-up')} />
      </View>
    </Screen>
  );
}
