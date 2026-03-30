import { AppShell } from "../components/layout/AppShell";
import { RouteTransition } from "../components/layout/RouteTransition";

export function App() {
  return (
    <AppShell>
      <RouteTransition />
    </AppShell>
  );
}
