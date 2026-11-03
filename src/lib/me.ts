import { useAuth } from './auth';
import { useStore } from './store';

/** The signed-in person's name and an id to credit their invites. Demo mode uses the sample client. */
export function useMe() {
  const { profile } = useAuth();
  const store = useStore();
  const demoName = store.clients.find((c) => c.id === 'me')?.name ?? 'Lo S.';
  return { name: profile?.display_name ?? demoName, refId: profile?.id ?? 'demo' };
}
