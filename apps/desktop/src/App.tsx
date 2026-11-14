import { Register } from '@/screens/register/Register';
import { SignIn } from '@/screens/sign_in/SignIn';
import { VentanaPrincipal } from '@/ventana_principal/VentanaPrincipal';

// Ventana principal (C-01). Las pantallas llegan en los pasos siguientes del plan.
export default function App() {
  return <VentanaPrincipal pantallasDeCuenta={{ register: Register, sign_in: SignIn }} />;
}
