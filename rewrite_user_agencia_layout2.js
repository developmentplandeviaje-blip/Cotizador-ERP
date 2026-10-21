const fs = require('fs');

let file_path = 'react-frontend/src/components/users/agencia/UserAgenciaList.jsx';
let content = fs.readFileSync(file_path, 'utf8');

// 1. Remove everything from `return (` up to the `{/* Search */}` line, except we need to keep `return (` and create the new layout.

const returnMatch = /return \(\s*<div style=\{\{ display: 'flex', flexDirection: 'column', gap: '20px' \}\}>[\s\S]*?\{\/\* Search \*\/\}\s*<div style=\{\{ position: 'relative', flex: '1', minWidth: '220px' \}\}>/;

let newLayout = `return (
    <div style={{ width: '100%' }}>
      {/* Breadcrumb & Title */}
      <div style={{ marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#b9c8ddff', marginBottom: '6px' }}>
          <span>Usuarios</span>
          <span>\\u203a</span>
          <span style={{ color: '#E87217', fontWeight: '600' }}>Agencia</span>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#FFFFFF' }}>
          Usuarios de Agencia
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#94A3B8' }}>
          Administraci\\u00f3n de asesores, comisiones y personal interno del ERP ({total} registrados)
        </p>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div style={{
          background: 'rgba(21, 128, 61, 0.2)',
          border: '1px solid #16a34a',
          color: '#86efac',
          padding: '12px 18px',
          borderRadius: '10px',
          fontSize: '0.875rem',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>{successBanner}</span>
          <button
            onClick={() => setSuccessBanner('')}
            style={{ background: 'none', border: 'none', color: '#86efac', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            \\u2715
          </button>
        </div>
      )}

      {/* Top Toolbar Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px',
        padding: '0px 20px',
      }}>
        {/* Search & Location/Agency Filters */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
            <span style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-40%)',
              color: '#b9c8ddff',
              fontSize: '1rem',
            }}>
              <img src={imgSearch} alt="" style={{ width: '20px', height: '20px' }} />
            </span>`;

content = content.replace(returnMatch, newLayout);

// 2. Fix search input
content = content.replace(
    /<input\s+type="text"\s+placeholder="Buscar por nombre o correo\.\.\."[\s\S]*?\/>/,
    `<input
      type="text"
      className="erp-input"
      style={{
        width: '280px',
        padding: '0 16px 0 44px',
        outline: 'none',
        fontSize: '0.875rem',
        borderRadius: '9999px',
        background: 'linear-gradient(150deg, rgb(255 255 255 / 8%) 1%, rgb(0 17 89 / 65%) 73%, rgb(255 255 255 / 39%) 108%)',
        height: '38px',
        boxShadow: 'rgba(0, 0, 0, 0.4) 3px 3px 6px, rgba(255, 255, 255, 0.05) -3px -3px 6px',
        border: '1px solid rgb(255 255 255 / 56%)',
        color: '#FFFFFF'
      }}
      placeholder="Buscar por nombre o correo..."
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setPage(1);
      }}
    />`
);
content = content.replace(/<img[\s\S]*?src=\{imgSearch\}[\s\S]*?\/>/, "");

// 3. Fix the roles dropdown
content = content.replace(
    /<select\s+className="erp-input"\s+value=\{selectedRole\}[\s\S]*?<\/select>/,
    `<select
      className="erp-input"
      value={selectedRole}
      onChange={(e) => {
        setSelectedRole(e.target.value);
        setPage(1);
      }}
      style={{
        borderRadius: '9999px',
        background: 'linear-gradient(150deg, rgb(255 255 255 / 8%) 1%, rgb(0 17 89 / 65%) 73%, rgb(255 255 255 / 39%) 108%)',
        height: '38px',
        boxShadow: 'rgba(0, 0, 0, 0.4) 3px 3px 6px, rgba(255, 255, 255, 0.05) -3px -3px 6px',
        border: '1px solid rgb(255 255 255 / 56%)',
        cursor: 'pointer',
        color: selectedRole ? '#FFFFFF' : '#b9c8ddff',
        appearance: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23b9c8dd\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'%3e%3cpolyline points=\\'6 9 12 15 18 9\\'%3e%3c/polyline%3e%3c/svg%3e")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'calc(100% - 20px) center',
        backgroundSize: '16px',
        padding: '0 36px 0 16px',
        width: '180px'
      }}
    >
      <option value="" style={{ background: '#101c44', color: '#b9c8ddff' }}>Todos los niveles</option>
      <option value="Administrador" style={{ background: '#101c44', color: '#FFFFFF' }}>Administrador</option>
      <option value="Sub Gerente" style={{ background: '#101c44', color: '#FFFFFF' }}>Sub Gerente</option>
      <option value="Lider" style={{ background: '#101c44', color: '#FFFFFF' }}>Líder</option>
      <option value="Asesor" style={{ background: '#101c44', color: '#FFFFFF' }}>Asesor</option>
    </select>`
);

// 4. Fix the status dropdown
content = content.replace(
    /<select\s+className="erp-input"\s+value=\{selectedStatus\}[\s\S]*?<\/select>/,
    `<select
      className="erp-input"
      value={selectedStatus}
      onChange={(e) => {
        setSelectedStatus(e.target.value);
        setPage(1);
      }}
      style={{
        borderRadius: '9999px',
        background: 'linear-gradient(150deg, rgb(255 255 255 / 8%) 1%, rgb(0 17 89 / 65%) 73%, rgb(255 255 255 / 39%) 108%)',
        height: '38px',
        boxShadow: 'rgba(0, 0, 0, 0.4) 3px 3px 6px, rgba(255, 255, 255, 0.05) -3px -3px 6px',
        border: '1px solid rgb(255 255 255 / 56%)',
        cursor: 'pointer',
        color: selectedStatus ? '#FFFFFF' : '#b9c8ddff',
        appearance: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23b9c8dd\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'%3e%3cpolyline points=\\'6 9 12 15 18 9\\'%3e%3c/polyline%3e%3c/svg%3e")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'calc(100% - 20px) center',
        backgroundSize: '16px',
        padding: '0 36px 0 16px',
        width: '180px'
      }}
    >
      <option value="" style={{ background: '#101c44', color: '#b9c8ddff' }}>Todos los estados</option>
      <option value="1" style={{ background: '#101c44', color: '#FFFFFF' }}>Habilitado</option>
      <option value="0" style={{ background: '#101c44', color: '#FFFFFF' }}>Deshabilitado</option>
    </select>`
);

// 5. Replace closing divs of the filter section and insert the action buttons
const closingMatch = /<\/div>\s*<\/div>\s*<\/div>\s*\{\/\* Data Table \*\/\}/;
let actionButtons = `  </div>
        </div>

        {/* Buttons Action Group */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flexDirection: 'column' }}>
            <button
              className="btn-secondary"
              onClick={() => window.print()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              title="Imprimir listado"
            >
              <img src={imgImprimir} alt="Imprimir" style={{ width: '20px', height: '20px' }} />
            </button>
            <span className='title-input'>Imprimir</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flexDirection: 'column' }}>
            <button
              className="btn-secondary"
              onClick={handleOpenCreate}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              title="Agregar Usuario"
            >
              <img src={imgAgregar} alt="Agregar" style={{ width: '20px', height: '20px' }} />
            </button>
            <span className='title-input'>Agregar</span>
          </div>
        </div>
      </div>

      {/* Data Table */}`;

content = content.replace(closingMatch, actionButtons);

// 6. Update Table Container
content = content.replace(
    /<div\s+style=\{\{\s*background: 'rgba\(30, 41, 59, 0\.72\)',\s*border: '1px solid rgba\(255, 255, 255, 0\.12\)',\s*borderRadius: '16px',\s*padding: '0',\s*overflow: 'hidden',\s*boxShadow: '0 10px 30px rgba\(0,0,0,0\.3\)',\s*\}\}\s*>/,
    `<div style={{
      background: 'rgba(188, 192, 215, 0.09)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
    }}>`
);

// It might not have 'padding: 0'
content = content.replace(
    /<div\s+style=\{\{\s*background: 'rgba\(30, 41, 59, 0\.72\)',\s*border: '1px solid rgba\(255, 255, 255, 0\.12\)',\s*borderRadius: '16px',\s*overflow: 'hidden',\s*boxShadow: '0 10px 30px rgba\(0,0,0,0\.3\)',\s*\}\}\s*>/,
    `<div style={{
      background: 'rgba(188, 192, 215, 0.09)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
    }}>`
);

// 7. Update Pagination
if (!content.includes("import Pagination from")) {
    content = content.replace(
        /import Badge from '\.\.\/\.\.\/common\/Badge';/,
        "import Badge from '../../common/Badge';\nimport Pagination from '../../common/Pagination';"
    );
    content = content.replace(
        /\{\/\* Pagination \*\/\}\s*<div\s+style=\{\{\s*display: 'flex',\s*justifyContent: 'space-between'[\s\S]*?<\/div>\s*<\/div>/,
        `{/* Pagination */}
        <Pagination page={page} lastPage={lastPage} total={total} onPageChange={setPage} itemName="usuarios" />
      </div>`
    );
}

fs.writeFileSync('react-frontend/src/components/users/agencia/UserAgenciaList.jsx', content, 'utf8');
console.log("Rewrote layout successfully");
