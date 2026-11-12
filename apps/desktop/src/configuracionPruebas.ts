import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Se carga antes de cada archivo de prueba (Vitest, setupFiles): desmonta lo que dejó cada prueba.
afterEach(cleanup);
