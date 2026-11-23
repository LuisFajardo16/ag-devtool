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
  - **Editor de Bloques (`BlockEditor.js`)**: Componente de sistema estilo Notion reutilizable en múltiples herramientas, con soporte para bloques de texto (`p`, `h1`, `h2`, `h3`, `quote`, `bullet`), código (`1 línea` | `bloque` con resaltado de sintaxis y edición con `Tab`/`Shift+Tab`), links (`url` | `bookmark`), imagen, `divider`, selector de color de texto y bloques de **1 a 3 columnas** (`1` por defecto).
  - **Editor de Código (`CodeEditor.js`)**: Editor de código reutilizable con resaltado de sintaxis en tiempo real, números de línea, indentación con `Tab` / `Shift+Tab`, auto-indentación y auto-cierre de pares.
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
- **Block Notes & Directories (`BlockNotesManager.js`)**:
  - Gestión de directorios jerárquicos y notas enriquecidas usando `BlockEditor.js`.
  - Header con `Title`, `Description` y propiedades tipadas (`texto`, `fecha` y `tags`), más un apartado integrado para crear y administrar tags.
- **File Manager (`FileManager.js`)**:
  - Gestión de múltiples workspaces locales con selección de directorio y árbol lateral de archivos básicos (`.md`, imágenes, `.json`, `.ts`, `.js`, texto y estilos).
  - Edición y vista previa (Preview / Edición / Dividido) para Markdown, preview interactivo con zoom para imágenes y resaltado de sintaxis con edición y guardado para archivos JSON, TS y JS.
- **Notes Manager**:
  - Creación de notas rápidas con **título** y **contenido**.
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
