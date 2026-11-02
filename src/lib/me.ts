import { useAuth } from './auth';

/** The signed-in person's name and an id to credit their invites. Demo mode uses the sample client. */
export function useMe() {
  const { profile } = useAuth();
  return { name: profile?.display_name ?? 'Lo S.', refId: profile?.id ?? 'demo' };
}
