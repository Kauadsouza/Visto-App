import { Redirect } from 'expo-router';

/** Raiz do app: quem entra primeiro vê o onboarding. */
export default function Index() {
  return <Redirect href="/onboarding" />;
}
