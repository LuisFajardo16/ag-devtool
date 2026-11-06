# AG-DevTool 🛠️

Entorno modular de utilidades para el desarrollo de software construido con **Vanilla JavaScript (ES Modules)**, **HTML5** y **Tailwind CSS**.

Diseñado para ejecutarse 100% en el navegador sin necesidad de backend, persistiendo todos los datos en `localStorage` y listo para publicarse directamente en **GitHub Pages**.

---

## ✨ Características Principales

- **Librería de Componentes Base Reutilizables (`src/components/ui/`)**:
  - **Botones (`Button.js`)**: Múltiples variantes (`primary`, `secondary`, `outline`, `ghost`, `danger`, `success`, `warning`), tamaños e iconos SVG.
  - **Popups / Modales (`Modal.js`)**: Ventanas emergentes personalizables y diálogos de confirmación (`Modal.confirm`).
  - **Dropdowns (`Dropdown.js`)**: Menús desplegables con iconos, badges, separadores y cierre automático al hacer clic fuera.
  - **Inputs y Textareas (`Input.js`)**: Controles de formulario estandarizados con soporte monoespaciado.
  - **Notificaciones (`Toast.js`), `Badge.js` y `Card.js`**.
- **Motor Multipanel Redimensionable (1 a 6 Paneles)**:
  - Divide el área de trabajo desde **1 hasta 6 paneles simultáneos**.
  - Redimensionamiento interactivo mediante arrastre (*drag-to-resize*) tanto en columnas como en filas.
  - Cada panel permite elegir qué utilidad instalada mostrar, maximizarse temporalmente o cerrarse.
- **Sidebar Colapsable**:
  - Lista de acceso rápido a las utilidades instaladas actualmente.
  - Estado expandido/colapsado persistido en `localStorage`.
- **Marketplace de Utilidades**:
  - Permite **agregar (instalar)** o **quitar (desinstalar)** utilidades en cualquier momento con búsqueda y filtros.
- **Notes Manager (Primera Herramienta Integrada)**:
  - Creación de notas con **título** y **contenido**.
  - Edición y eliminación con popup de confirmación.
  - Búsqueda instantánea y sincronización automática en `localStorage`.
- **Rol de Administrador (Acceso con Hash SHA-256)**:
  - El usuario estándar no necesita iniciar sesión.
  - El administrador puede autenticarse para desbloquear la **Zona Admin**, que incluye el **Catálogo Interactivo de Componentes Visuales (UI Kit)** y el **Inspector de `localStorage`**.

---

## 🔐 Credenciales de Administrador

Para acceder a las vistas exclusivas de administrador (Catálogo de Componentes UI e Inspector de Almacenamiento), haz clic en el botón **`Admin Login`** en la esquina superior derecha e ingresa:

- **Usuario**: `admin`
- **Contraseña**: `admin123**`

> **Nota sobre seguridad**: La validación utiliza la API nativa del navegador **Web Crypto API (`crypto.subtle.digest('SHA-256', ...)`)** comparando el hash SHA-256 con *salt* de las credenciales, evitando almacenar la contraseña en texto plano dentro del código fuente.

---

## 🚀 Uso en Desarrollo Local

Al usar **ES Modules** nativos (`<script type="module">`), debes abrir el proyecto mediante cualquier servidor HTTP estático local (para evitar restricciones CORS del protocolo `file://`).

### Opción 1: Con Node.js (`npx serve`)
```bash
npx serve .
```

### Opción 2: Con Python
```bash
python -m http.server 8080
```

### Opción 3: Extensión Live Server (VS Code / Antigravity)
Haz clic derecho sobre `index.html` y selecciona **"Open with Live Server"**.

---

## 🌐 Despliegue en GitHub Pages

El proyecto ya incluye el archivo `.nojekyll`, rutas relativas en todos los módulos y el workflow automático `.github/workflows/deploy.yml`.

### Método A: Despliegue Automático con GitHub Actions (Recomendado)
1. Sube tus cambios a tu repositorio en GitHub en la rama `main` (o `master`):
   ```bash
   git add .
   git commit -m "feat: initial release of AG-DevTool"
   git push origin main
   ```
2. En tu repositorio de GitHub, ve a **Settings** → **Pages**.
3. En la sección **Build and deployment** → **Source**, selecciona **GitHub Actions**.
4. El workflow `Deploy AG-DevTool to GitHub Pages` se ejecutará automáticamente y publicará tu aplicación en `https://<tu-usuario>.github.io/<tu-repositorio>/`.

### Método B: Despliegue Directo desde una Rama
Como el proyecto no requiere compilación:
1. En GitHub, ve a **Settings** → **Pages**.
2. En **Source**, elige **Deploy from a branch**.
3. Selecciona la rama `main` y la carpeta `/ (root)` y haz clic en **Save**.

---

## 🧠 Cerebro Local (`.lucho-workspace`)

El directorio `.lucho-workspace/` en la raíz contiene el contexto extendido del proyecto:
- [`.lucho-workspace/README.md`](./.lucho-workspace/README.md): Índice general del cerebro local.
- [`.lucho-workspace/rules.md`](./.lucho-workspace/rules.md): Reglas del proyecto, convenciones de `localStorage` y contrato de herramientas.
- [`.lucho-workspace/architecture.md`](./.lucho-workspace/architecture.md): Detalle de la arquitectura modular y del gestor de 1 a 6 paneles.
