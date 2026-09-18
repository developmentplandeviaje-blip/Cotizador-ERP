const fs = require("fs");
let content = fs.readFileSync("react-frontend/src/components/layout/Sidebar.jsx", "utf8");

const state_addition = `
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const newVal = !prev;
      localStorage.setItem("sidebar_collapsed", newVal);
      return newVal;
    });
  };

  const sidebarWidth = isCollapsed ? "80px" : "240px";
`;

content = content.replace("const [openMenus, setOpenMenus] = useState({", state_addition + "\n  const [openMenus, setOpenMenus] = useState({");

content = content.replace("width: '240px',", "width: sidebarWidth,\n        transition: 'width 0.3s ease, padding 0.3s ease',");
content = content.replace("className=\"sidebar-container\"", "className={`sidebar-container ${isCollapsed ? 'collapsed' : ''}`}");

const logo_html = `
      <div
        style={{
          padding: isCollapsed ? '0' : '0 24px',
          marginBottom: '5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          flexDirection: isCollapsed ? 'column' : 'row',
          gap: isCollapsed ? '10px' : '0',
        }}
      >
        <div style={{ display: isCollapsed ? 'none' : 'block', cursor: 'pointer' }} onClick={() => onNavigate('dashboard')}>
          <img
            src={logoinicio}
            alt="Plan de Viaje"
            style={{ width: '80px', height: 'auto', objectFit: 'contain' }}
          />
        </div>
        <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Alternar Menú">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
`;

content = content.replace(/\{\/\* Top Logo \*\/\}.*?(?=\{\/\* Navigation List \*\/\})/s, logo_html);

const style_block = `
      <style>{\`
        .sidebar-container.collapsed .nav-text {
          display: none;
        }
        .sidebar-container.collapsed button {
          justify-content: center !important;
          padding: 10px 0 !important;
        }
        .sidebar-container.collapsed .submenu-container {
          margin-left: 0 !important;
          padding-left: 0 !important;
          border-left: none !important;
          align-items: center !important;
        }
        .sidebar-container.collapsed .submenu-container button {
          padding: 6px 0 !important;
        }
      \`}</style>
    </aside>
`;
content = content.replace("</aside>", style_block);

// In the original, submenuContainerStyle has marginLeft: 16px, paddingLeft: 14px, borderLeft: 2px solid...
// I will change it to use className "submenu-container" so we can override it in CSS.
content = content.replace(/style=\{submenuContainerStyle\}/g, 'className="submenu-container" style={submenuContainerStyle}');

// Add nav-text class to all spans that have text.
content = content.replace(/<span style=\{\{(.*?)\}\}>([^<]+)<\/span>/g, "<span className=\"nav-text\" style={{$1}}>$2</span>");
content = content.replace(/<span>([^<]+)<\/span>/g, "<span className=\"nav-text\">$1</span>");

// Add title tooltips.
// 1. Dashboard
content = content.replace("onClick={() => onNavigate('dashboard')}", "title={isCollapsed ? 'Dashboard' : undefined} onClick={() => onNavigate('dashboard')}");
// 2. Nueva Cotización
content = content.replace("onClick={() => onNavigate('nueva_cotizacion')}", "title={isCollapsed ? 'Nueva Cotización' : undefined} onClick={() => onNavigate('nueva_cotizacion')}");
// 3. Ventas
content = content.replace("onClick={() => toggleMenu('ventas')}", "title={isCollapsed ? 'Ventas' : undefined} onClick={() => toggleMenu('ventas')}");
content = content.replace("onClick={() => onNavigate('ventas_agencia')}", "title={isCollapsed ? 'Ventas Agencia' : undefined} onClick={() => onNavigate('ventas_agencia')}");
content = content.replace("onClick={() => onNavigate('ventas_freelancer')}", "title={isCollapsed ? 'Ventas Freelancer' : undefined} onClick={() => onNavigate('ventas_freelancer')}");
// 4. Reportes
content = content.replace("onClick={() => toggleMenu('reportes')}", "title={isCollapsed ? 'Reportes' : undefined} onClick={() => toggleMenu('reportes')}");
// For the dynamic reportes, it's inside a .map:
content = content.replace("onClick={() => onNavigate(sub.id)}", "title={isCollapsed ? sub.label : undefined} onClick={() => onNavigate(sub.id)}");
// 5. Servicios
content = content.replace("onClick={() => toggleMenu('servicios')}", "title={isCollapsed ? 'Servicios' : undefined} onClick={() => toggleMenu('servicios')}");
content = content.replace("onClick={() => onNavigate('servicios_hoteles')}", "title={isCollapsed ? 'Hoteles' : undefined} onClick={() => onNavigate('servicios_hoteles')}");
content = content.replace("onClick={() => onNavigate('servicios_excursiones')}", "title={isCollapsed ? 'Excursiones' : undefined} onClick={() => onNavigate('servicios_excursiones')}");
content = content.replace("onClick={() => onNavigate('servicios_paquetes')}", "title={isCollapsed ? 'Paquetes' : undefined} onClick={() => onNavigate('servicios_paquetes')}");
content = content.replace("onClick={() => onNavigate('servicios_traslados')}", "title={isCollapsed ? 'Traslados' : undefined} onClick={() => onNavigate('servicios_traslados')}");
content = content.replace("onClick={() => onNavigate('servicios_vehiculos')}", "title={isCollapsed ? 'Vehículos' : undefined} onClick={() => onNavigate('servicios_vehiculos')}");
content = content.replace("onClick={() => onNavigate('servicios_aerolineas')}", "title={isCollapsed ? 'Aerolíneas' : undefined} onClick={() => onNavigate('servicios_aerolineas')}");
content = content.replace("onClick={() => onNavigate('servicios_ubicaciones')}", "title={isCollapsed ? 'Ubicaciones' : undefined} onClick={() => onNavigate('servicios_ubicaciones')}");
// 6. Gastos
content = content.replace("onClick={() => onNavigate('gastos')}", "title={isCollapsed ? 'Gastos' : undefined} onClick={() => onNavigate('gastos')}");
// 7. Métodos de pago
content = content.replace("onClick={() => onNavigate('metodos_pago')}", "title={isCollapsed ? 'Métodos de pago' : undefined} onClick={() => onNavigate('metodos_pago')}");
// 8. Usuarios
content = content.replace("onClick={() => toggleMenu('usuarios')}", "title={isCollapsed ? 'Usuarios' : undefined} onClick={() => toggleMenu('usuarios')}");
content = content.replace("onClick={() => onNavigate('usuarios_agencia')}", "title={isCollapsed ? 'Usuarios Agencia' : undefined} onClick={() => onNavigate('usuarios_agencia')}");
content = content.replace("onClick={() => onNavigate('usuarios_freelancer')}", "title={isCollapsed ? 'Usuarios Freelancer' : undefined} onClick={() => onNavigate('usuarios_freelancer')}");
// 9. Cerrar Sesión
content = content.replace("onClick={onLogout}", "title={isCollapsed ? 'Cerrar Sesión' : undefined} onClick={onLogout}");

// In the screenshots, the submenu vertical line is shown.
// "un comportamiento similar para los submenu en el estado pregable"
// Looking closely at the screenshots: when collapsed, the vertical line IS still there!
// The icons in the submenu are just shifted slightly.
// Oh wait, in the screenshots, there IS a vertical line!
// So I should NOT remove the border-left.
// Let's modify the CSS style for collapsed submenus to keep the border-left and margin-left,
// but just hide the text and center the icons relative to the line?
// Actually, the screenshots show:
// Left: vertical line. Right: icon.
// Let's modify the CSS in `style_block` again.

const style_block_fixed = `
      <style>{\`
        .sidebar-container.collapsed .nav-text {
          display: none;
        }
        .sidebar-container.collapsed > nav > button,
        .sidebar-container.collapsed > nav > div > button {
          justify-content: center !important;
          padding: 10px 0 !important;
        }
        /* For submenus in collapsed mode */
        .sidebar-container.collapsed .submenu-container {
          /* Keep the line, but adjust padding to center the icon */
          margin-left: 20px !important;
          padding-left: 10px !important;
        }
        .sidebar-container.collapsed .submenu-container button {
          justify-content: center !important;
          padding: 6px 0 !important;
        }
      \`}</style>
    </aside>
`;

content = content.replace(style_block, style_block_fixed);

fs.writeFileSync("react-frontend/src/components/layout/Sidebar.jsx", content, "utf8");
console.log("Done");
