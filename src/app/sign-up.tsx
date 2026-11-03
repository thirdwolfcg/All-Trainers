import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button, Card, Field, Icon, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function SignUp() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);

  const valid = /\S+@\S+\.\S+/.test(email) && password.length >= 8;

  const submit = async () => {
    setBusy(true);
    setError(undefined);
    const res = await signUp(email, password);
    setBusy(false);
    if (res.error) setError(res.error);
    else if (res.needsConfirmation) setSent(true);
    // Otherwise the session starts and the app moves on to onboarding.
  };

  if (sent) {
    return (
      <Screen title="Check your inbox" subtitle={`We sent a link to ${email.trim()}. Tap it to confirm, then come back and sign in.`} padTop={false}>
        <Card tone="purple" style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'center', marginBottom: Spacing.xl }}>
          <Icon name="mail-unread-outline" size={22} color="primaryDeep" />
          <Text variant="body" style={{ flex: 1 }}>
            Not seeing it? Check spam or promotions.
          </Text>
        </Card>
        <Button label="Go to sign in" onPress={() => router.replace('/sign-in')} />
      </Screen>
    );
  }

  return (
    <Screen eyebrow="New here" title="Hiii, welcome in" subtitle="Takes a sec, and it's free. Let's get you set up." padTop={false}>
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
          placeholder="At least 8 characters"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          error={error}
          hint="At least 8 characters."
        />
        <Button label={busy ? 'Setting you up…' : 'Create account'} disabled={!valid || busy} onPress={submit} />
        {!valid && (email || password) ? (
          <Text variant="small" color="textSecondary" align="center">
            {!/\S+@\S+\.\S+/.test(email) ? 'Add a valid email to keep going.' : 'Your password needs at least 8 characters.'}
          </Text>
        ) : null}
        <Button kind="ghost" label="I already have an account" onPress={() => router.replace('/sign-in')} />
      </View>
    </Screen>
  );
}
