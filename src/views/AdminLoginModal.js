import {
  Modal,
  createInput,
  createButton,
  Toast
} from '../components/ui/index.js';
import { AuthService } from '../core/auth.js';

/**
 * Abre el Popup de Login para el Administrador del sistema
 */
export function openAdminLoginModal() {
  let modalRef = null;

  const form = document.createElement('form');
  form.className = 'space-y-4';

  const infoBox = document.createElement('div');
  infoBox.className =
    'p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-200 leading-relaxed';
  infoBox.innerHTML = `
    <strong class="block text-indigo-300 mb-0.5">Acceso de Administrador</strong>
    Desbloquea el catálogo interactivo de componentes visuales (Popups, Dropdowns, Botones, etc.) y el inspector de almacenamiento.
  `;

  const userField = createInput({
    label: 'Usuario',
    placeholder: 'admin',
    value: '',
    required: true
  });

  const passField = createInput({
    label: 'Contraseña',
    type: 'password',
    placeholder: '••••••••••',
    value: '',
    required: true,
    helperText: 'Verificación mediante hash SHA-256 (Web Crypto API).'
  });

  const errorBanner = document.createElement('div');
  errorBanner.className =
    'hidden p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300';

  form.append(infoBox, userField, passField, errorBanner);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    errorBanner.classList.add('hidden');
    const username = userField.getValue();
    const password = passField.getValue();

    const result = await AuthService.login(username, password);
    if (result.ok) {
      Toast.success('Sesión de Administrador iniciada');
      modalRef?.close();
    } else {
      errorBanner.textContent = result.error;
      errorBanner.classList.remove('hidden');
      Toast.error('Credenciales incorrectas');
    }
  }

  form.addEventListener('submit', handleSubmit);

  const cancelBtn = createButton({
    label: 'Cancelar',
    variant: 'secondary',
    size: 'sm',
    onClick: () => modalRef?.close()
  });

  const submitBtn = createButton({
    label: 'Iniciar Sesión',
    icon: 'shield',
    variant: 'primary',
    size: 'sm',
    onClick: () => handleSubmit()
  });

  modalRef = Modal.open({
    title: 'Login de Administrador',
    subtitle: 'Ingresa tus credenciales de administrador del sistema',
    size: 'sm',
    content: form,
    footer: [cancelBtn, submitBtn]
  });

  setTimeout(() => userField.input.focus(), 50);
}
