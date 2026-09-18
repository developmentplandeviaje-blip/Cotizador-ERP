import re

with open("react-frontend/src/components/layout/Sidebar.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add isCollapsed state and toggle function
state_addition = """
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });
  const [hoveredMenu, setHoveredMenu] = useState(null);

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const newVal = !prev;
      localStorage.setItem("sidebar_collapsed", newVal);
      return newVal;
    });
  };

  const sidebarWidth = isCollapsed ? "80px" : "240px";
"""
content = content.replace("const [openMenus, setOpenMenus] = useState({", state_addition + "\n  const [openMenus, setOpenMenus] = useState({")

# Replace width: "240px" with sidebarWidth
content = content.replace("width: '240px',", "width: sidebarWidth,\n        transition: 'width 0.3s ease, padding 0.3s ease',")
content = content.replace("overflowY: 'auto',", "overflowY: isCollapsed ? 'visible' : 'auto',\n        overflowX: isCollapsed ? 'visible' : 'hidden',")
content = content.replace("className=\"sidebar-container\"", "className={`sidebar-container ${isCollapsed ? 'collapsed' : '}`}")

# Logo and toggle button
logo_html = """
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
        <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
"""
content = re.sub(r"\{/\* Top Logo \*/\}.*?(?=\{/\* Navigation List \*/\})", logo_html, content, flags=re.DOTALL)


# Let's add the <style> block at the end of the return statement
style_block = """
      <style>{`
        .sidebar-container.collapsed .nav-text {
          display: none;
        }
        .sidebar-container.collapsed button {
          justify-content: center;
          padding: 10px 0;
        }
        .nav-item-wrapper {
          position: relative;
        }
        .flyout-menu {
          position: absolute;
          left: 80px;
          top: 0;
          width: 200px;
          background: linear-gradient(260deg, rgb(17 46 139) 0%, rgb(28 39 85) 100%);
          border-radius: 8px;
          padding: 8px;
          z-index: 1000;
          box-shadow: 4px 4px 15px rgba(0,0,0,0.5);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
      `}</style>
    </aside>
"""
content = content.replace("</aside>", style_block)

# Add nav-text class to all spans that have text.
content = re.sub(r"<span style=\{\{(.*?)\}\}>([^<]+)</span>", r"<span className=\"nav-text\" style={{\1}}>\2</span>", content)
content = re.sub(r"<span>([^<]+)</span>", r"<span className=\"nav-text\">\1</span>", content)


# Now wrap menus. There are 4 menus with dropdowns: ventas, reportes, servicios, usuarios.
# We will do a robust manual regex replacement for each.

menus = ["ventas", "reportes", "servicios", "usuarios"]

for menu in menus:
    # Find the block starting with: {/* X. Menu */} or similar, but the easiest is `<div>\n          <button\n            onClick={() => toggleMenu('MENU')}`
    # Wait, the structure is:
    # <div>
    #   <button onClick={() => toggleMenu('MENU')} ...> ... </button>
    #   {openMenus.MENU && (
    #     <div style={submenuContainerStyle}> ... </div>
    #   )}
    # </div>
    
    pattern = r"(<div>\s*<button\s*onClick=\{\(\) => toggleMenu\('" + menu + r"'\)\}.*?\{openMenus\." + menu + r" && \(\s*<div style=\{submenuContainerStyle\}>(.*?)</div>\s*\)\}\s*</div>)"
    
    def repl(m):
        full_block = m.group(1)
        inner_items = m.group(2)
        
        # Replace the outer div with a wrapper that has onMouseEnter
        new_block = full_block.replace("<div>", "<div \n          className=\"nav-item-wrapper\"\n          onMouseEnter={() => isCollapsed && setHoveredMenu('" + menu + "')}\n          onMouseLeave={() => isCollapsed && setHoveredMenu(null)}\n        >", 1)
        
        # Replace the condition `{openMenus.MENU && (` with `{(!isCollapsed && openMenus.MENU) && (`
        new_block = new_block.replace("{openMenus." + menu + " && (", "{(!isCollapsed && openMenus." + menu + ") && (")
        
        # Append the flyout menu
        flyout = "\n          {isCollapsed && hoveredMenu === '" + menu + "' && (\n            <div className=\"flyout-menu\">\n" + inner_items + "\n            </div>\n          )}\n        </div>"
        
        # We need to replace the last </div> of the block with the flyout.
        # It's easier to just rsplit
        new_block = new_block.rsplit("</div>", 1)[0] + flyout
        return new_block

    content = re.sub(pattern, repl, content, flags=re.DOTALL)

with open("react-frontend/src/components/layout/Sidebar.jsx", "w", encoding="utf-8") as f:
    f.write(content)

