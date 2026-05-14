# Guía de Diseño - EduSpace Frontend

Este documento establece las directrices de diseño y arquitectura para el frontend de **EduSpace** para asegurar la consistencia visual y técnica en todo el proyecto.

## 🎨 Identidad Visual

### Tipografía
- **Fuente Principal:** [Poppins](https://fonts.google.com/specimen/Poppins) (Sans-serif)
- **Escala:**
  - `h1`: 3.2em, line-height 1.1
  - Texto base: line-height 1.5, font-weight 400

### Colores (Basado en PrimeVue & PrimeFlex)
Se utiliza el sistema de colores de **PrimeVue** con soporte para temas:
- **Primario:** `info` (Azul/Cian) para acciones principales.
- **Peligro:** `danger` (Rojo) para eliminaciones y alertas críticas.
- **Advertencia:** `yellow-500` para estados e iconos específicos.
- **Texto:** `text-600` para etiquetas, `text-gray-700` para detalles.

### Componentes de UI (PrimeVue)
Se deben utilizar exclusivamente componentes de [PrimeVue v4](https://primevue.org/) para mantener la uniformidad:
- **Botones:** `<pv-button>` con variantes `text`, `raised` o `severity`.
- **Layout:** [PrimeFlex](https://primeflex.org/) para utilidades de espaciado y flexbox (`flex`, `align-items-center`, `gap-2`, `p-3`).
- **Iconos:** [PrimeIcons](https://primeflex.org/icons) e.g., `<i class="pi pi-box">`.

---

## 🏗️ Estructura del Proyecto

El proyecto sigue una arquitectura orientada a dominios (Bounded Contexts):

```text
src/
├── classroom-space-resource-management/ # Dominio de Inventario y Espacios
├── dashboard-admin/                     # Vistas de Administración
├── iam/                                 # Identidad y Acceso (Login/Register)
├── meeting-management/                  # Gestión de Reuniones/Horarios
├── personal-data/                       # Información del Usuario
├── router/                              # Configuración de Rutas de Vue Router
├── shared/                              # Componentes y Servicios Reutilizables
└── store/                               # Estado Global (Vuex)
```

### Convenciones dentro de los Dominios
Cada dominio debe subdividirse en:
- `components/`: Componentes específicos del negocio (e.g., `classroom-card.component.vue`).
- `model/`: Entidades y clases de datos (`.entity.js`).
- `pages/`: Componentes de página que se conectan al router.
- `services/`: Lógica de API (usando Axios).

---

## 🛠️ Estándares de Código

### Componentes Vue
- Usar **Options API** (procurar consistencia con el código existente).
- **Nomenclatura:** `nombre-del-componente.component.vue` (kebab-case).
- **Scoped Styles:** Siempre usar `<style scoped>` para evitar fugas de estilos.

### Servicios API
- Base URL centralizada.
- Manejo de errores consistente en la capa de servicio o mediante interceptores.
- Formato de nombre: `ejemplo.service.js`.

---

## 📱 Responsividad
- Se utiliza la rejilla de **PrimeFlex**.
- Clases comunes: `w-full`, `h-full`, `shadow-2`, `border-round-xl`.
