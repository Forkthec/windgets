import { Agenda } from '@/screens/agenda/Agenda';
import { Kanban } from '@/screens/kanban/Kanban';
import { Labels } from '@/screens/labels/Labels';
import { PlannerDaily } from '@/screens/planner_daily/PlannerDaily';
import { Register } from '@/screens/register/Register';
import { SignIn } from '@/screens/sign_in/SignIn';
import { VentanaPrincipal } from '@/ventana_principal/VentanaPrincipal';

// Ventana principal (C-01). Las pantallas llegan en los pasos siguientes del plan.
export default function App() {
  return (
    <VentanaPrincipal
      pantallas={{ agenda: Agenda, kanban: Kanban, labels: Labels, planner_daily: PlannerDaily }}
      pantallasDeCuenta={{ register: Register, sign_in: SignIn }}
    />
  );
}
