import { Register } from '@/screens/register/Register';
import { VentanaPrincipal } from '@/ventana_principal/VentanaPrincipal';

// Ventana principal (C-01). Las pantallas llegan en los pasos siguientes del plan.
export default function App() {
  return <VentanaPrincipal pantallasDeCuenta={{ register: Register }} />;
}
