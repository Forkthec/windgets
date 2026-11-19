import { Agenda } from '@/screens/agenda/Agenda';
import { Calendario } from '@/screens/calendar/Calendario';
import { Kanban } from '@/screens/kanban/Kanban';
import { Labels } from '@/screens/labels/Labels';
import { Personalization } from '@/screens/personalization/Personalization';
import { Reports } from '@/screens/reports/Reports';
import { Settings } from '@/screens/settings/Settings';
import { PlannerDaily } from '@/screens/planner_daily/PlannerDaily';
import { Register } from '@/screens/register/Register';
import { SignIn } from '@/screens/sign_in/SignIn';
import { Themes } from '@/screens/themes/Themes';
import { Widgets } from '@/screens/widgets/Widgets';
import { Windi } from '@/screens/windi/Windi';
import { VentanaPrincipal } from '@/ventana_principal/VentanaPrincipal';

// Ventana principal (C-01). Las pantallas llegan en los pasos siguientes del plan.
export default function App() {
  return (
    <VentanaPrincipal
      pantallas={{
        agenda: Agenda,
        calendar: Calendario,
        kanban: Kanban,
        labels: Labels,
        personalization: Personalization,
        planner_daily: PlannerDaily,
        reports: Reports,
        settings: Settings,
        themes: Themes,
        widgets: Widgets,
        windi: Windi,
      }}
      pantallasDeCuenta={{ register: Register, sign_in: SignIn }}
    />
  );
}
