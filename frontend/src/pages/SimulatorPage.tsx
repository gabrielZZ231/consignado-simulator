import { BankRules } from '../components/BankRules';
import { DemoBanner } from '../components/DemoBanner';
import { Header } from '../components/Header';
import { ResultsPanel } from '../components/ResultsPanel';
import { SimulationForm } from '../components/SimulationForm';
import { useSimulation } from '../hooks/useSimulation';
import type { PublicUser } from '../types/auth.types';

interface SimulatorPageProps {
  currentUser?: PublicUser;
  onLogout?: () => void;
  onOpenAccessManagement?: () => void;
  showAccessHint?: boolean;
  onDismissAccessHint?: () => void;
}

export function SimulatorPage({
  currentUser,
  onLogout,
  onOpenAccessManagement,
  showAccessHint = false,
  onDismissAccessHint
}: SimulatorPageProps) {
  const { status, data, errorMessage, fieldErrors, submitSimulation, resetSimulation } =
    useSimulation();

  return (
    <div className="min-h-screen bg-[#F4F8FB] text-[#102A43]">
      <Header
        currentUser={currentUser}
        activePage="simulator"
        onOpenAccessManagement={onOpenAccessManagement}
        onLogout={onLogout}
        showAccessHint={showAccessHint}
        onDismissAccessHint={onDismissAccessHint}
      />
      <DemoBanner />

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
          <div className="min-w-0 space-y-6">
            <SimulationForm
              isSubmitting={status === 'submitting'}
              onSubmitSimulation={submitSimulation}
            />
            <BankRules />
          </div>

          <div className="min-w-0">
            <ResultsPanel
              status={status}
              data={data}
              errorMessage={errorMessage}
              fieldErrors={fieldErrors}
              onReset={resetSimulation}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
