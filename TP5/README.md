# Cubrí Seguros — Flujo de Contratación Digital (Seguro de Celular)

Aplicación web **Single Page Application (SPA)** para el checkout multipaso de contratación de seguros de celular, desarrollada para la asignatura **Diseño UX/UI (2026) — Licenciatura en Sistemas de Información (FCyT - UADER)**.

---

## 1. Stack Tecnológico

- **HTML5 Semántico** y accesible (`role="group"`, `aria-invalid`, `aria-describedby`, `role="alert"`).
- **Tailwind CSS v4** (vía CDN) con enfoque **Mobile First (`390px`)** y diseño responsive **Desktop (`1440px`, prefijo `lg:`)**.
- **Basecoat UI v1.1.0** (vía CDN) para el sistema de componentes (`btn`, `field`, `card`, `badge`, `alert`).
- **JavaScript Vanilla (ES Modules)** sin frameworks ni librerías externas.

---

## 2. Cómo ejecutar el proyecto

Dado que el proyecto utiliza **ES Modules** (`<script type="module">`) y carga el catálogo de planes mediante `fetch('data/planes.json')`, debe servirse desde un servidor HTTP local (no abrir con doble click mediante el protocolo `file://`).

### Opción A: Con `npx serve` (Node.js)
```bash
npx serve .
```
Luego abrí en el navegador la URL indicada en consola (por ejemplo, `http://localhost:3000`).

### Opción B: Con la extensión **Live Server** en VS Code
1. Abrí la carpeta del proyecto en Visual Studio Code.
2. Hacé click derecho sobre `index.html` y seleccioná **"Open with Live Server"**.

---

## 3. Arquitectura y Decisiones de Diseño

```text
cubri-seguros/
├── index.html          ← Maquetado único de las 7 pantallas (section[data-paso="0..6"])
├── css/
│   └── tokens.css      ← Fuente Inter + variables Basecoat UI y tokens de diseño
├── data/
│   └── planes.json     ← Catálogo de planes (Básico, Plus, Premium) y tasas anuales
├── js/
│   ├── app.js          ← Punto de entrada, fetch de planes, eventos, máscaras y flujo de pago
│   ├── estado.js       ← Único objeto de estado `solicitud`, navegación y persistencia localStorage
│   ├── render.js       ← Renderizado reactivo de pasos, stepper, cards de plan y único resumen
│   ├── validaciones.js ← Funciones puras de validación por campo y por paso
│   ├── cotizador.js    ← Fórmula oficial `calcularCuota()` y `formatearMoneda()` en ARS
│   └── pago.js         ← `simularPago()` con latencia de 1,5 s y `generarPoliza()`
└── README.md
```

- **Un único estado (`solicitud`)**: Toda la información del flujo vive en `js/estado.js`. Ningún cálculo lee precios o textos del DOM.
- **Un único resumen (`<aside id="resumen-compra">`)**: Siguiendo la regla de oro de la cátedra, el nodo HTML del resumen no se duplica; se adapta con clases de Tailwind como barra fija inferior en mobile (`390px`) y columna lateral sticky de `380px` en desktop (`lg:`).
- **Conservación de datos al retroceder**: `render()` sincroniza los valores de todos los inputs desde `solicitud`, garantizando que al presionar **"Volver"** o al reintentar un pago nunca se pierda información cargada.

---

## 4. Reglas de Negocio y Casos de Prueba

### 4.1 Fórmula de cotización
$$\text{cuota} = \text{Math.round}\left(\text{valor} \times \frac{\text{tasaAnual}}{12} \times \text{factorAntigüedad}\right)$$

| Antigüedad | Identificador | Factor |
| :--- | :--- | :--- |
| Menos de 1 año | `menos_1` | `1.00` |
| 1 a 2 años | `1_a_2` | `1.10` |
| Más de 2 años | `mas_2` | `1.25` |

### 4.2 Casos de prueba verificados
| Valor del equipo | Antigüedad | Plan Básico (4%) | Plan Plus (6%) | Plan Premium (9%) |
| :--- | :--- | :--- | :--- | :--- |
| **$ 600.000** | Menos de 1 año (`1.00`) | **$ 2.000** | **$ 3.000** | **$ 4.500** |
| **$ 600.000** | 1 a 2 años (`1.10`) | **$ 2.200** | **$ 3.300** | **$ 4.950** |
| **$ 1.200.000** | Más de 2 años (`1.25`) | **$ 5.000** | **$ 7.500** | **$ 11.250** |

### 4.3 Tarjetas de prueba para simulación de pago (Paso 4)
| Número de tarjeta | Resultado esperado |
| :--- | :--- |
| `4111 1111 1111 1111` (o cualquier número válido de 16 dígitos distinto al de rechazo) | **Aprobado** → Emite póliza `POL-AAAA-NNNNNN` y navega a la pantalla de Éxito (`data-paso="5"`). |
| `4000 0000 0000 0002` | **Rechazado** → Navega a la pantalla de Error (`data-paso="6"`) conservando todos los datos para reintentar o cambiar medio de pago. |

---

## 5. Bonus Implementados

1. **Persistencia en `localStorage`**: El objeto `solicitud` se guarda automáticamente ante cada cambio, permitiendo recargar la página (`F5`) sin perder el avance ni los datos cargados. Al confirmar la póliza o reiniciar la solicitud en la pantalla de éxito, el borrador se limpia automáticamente.
2. **Máscaras de input en tiempo real**:
   - **Valor del equipo**: separador de miles automático con puntos (`600.000`).
   - **Número de tarjeta**: agrupación automática en bloques de 4 dígitos (`4111 1111 1111 1111`).
   - **Vencimiento**: inserción automática de la barra `MM/AA`.
3. **Edición rápida desde el resumen final**: En el resumen de contratación del Paso 4 se incluyeron accesos directos (**"Editar" / "Editar plan"**) que llevan directamente al Paso 1 (Equipo), Paso 2 (Plan) o Paso 3 (Datos del titular) manteniendo toda la información cargada.
