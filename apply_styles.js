const fs = require('fs');

const file = 'react-frontend/src/components/finance/metodos_pago/MetodoPagoList.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Replace the old header and filters with the new Toolbar Controls
// Old code has `{/* Header */}` and `{/* Filters Toolbar */}`
const headerRegex = /\{\/\* Header \*\/\}[\s\S]*?\{\/\* Main Table \*\/\}/;

const newToolbar = `{/* Top Toolbar Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px',
        padding: '0px 20px',
      }}>
        {/* Search & Dropdown Filters */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', width: '300px' }}>
            <span style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-40%)',
              fontSize: '1rem',
            }}>
              <img src={imgSearch} alt="" style={{ width: '20px', height: '20px' }} />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre, titular o correo..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="erp-input"
              style={{
                width: '100%',
                borderRadius: '9999px',
                background: 'linear-gradient(150deg, rgb(255 255 255 / 8%) 1%, rgb(0 17 89 / 65%) 73%, rgb(255 255 255 / 39%) 108%)',
                height: '38px',
                paddingLeft: '40px',
                boxShadow: 'rgba(0, 0, 0, 0.4) 3px 3px 6px, rgba(255, 255, 255, 0.05) -3px -3px 6px',
                border: '1px solid rgb(255 255 255 / 56%)',
                color: '#FFFFFF'
              }}
            />
          </div>

          {/* Tipo Filter */}
          <div style={{ width: '210px' }}>
            <select
              value={selectedTipo}
              onChange={(e) => {
                setSelectedTipo(e.target.value);
                setPage(1);
              }}
              className="erp-input"
              style={{
                borderRadius: '9999px',
                background: 'linear-gradient(150deg, rgb(255 255 255 / 8%) 1%, rgb(0 17 89 / 65%) 73%, rgb(255 255 255 / 39%) 108%)',
                height: '38px',
                paddingLeft: '14px',
                paddingRight: '36px',
                boxShadow: 'rgba(0, 0, 0, 0.4) 3px 3px 6px, rgba(255, 255, 255, 0.05) -3px -3px 6px',
                border: '1px solid rgb(255 255 255 / 56%)',
                color: selectedTipo ? '#FFFFFF' : '#b9c8ddff',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                backgroundImage: \`url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23b9c8dd' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")\`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'calc(100% - 12px) center',
                backgroundSize: '16px',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <option value="" style={{ backgroundColor: '#101c44', color: '#FFF' }}>Todos los tipos</option>
              <option value="banco" style={{ backgroundColor: '#101c44', color: '#FFF' }}>🏦 Cuentas Bancarias</option>
              <option value="digital" style={{ backgroundColor: '#101c44', color: '#FFF' }}>💳 Digital / Gateway</option>
              <option value="efectivo" style={{ backgroundColor: '#101c44', color: '#FFF' }}>💵 Efectivo</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ width: '180px' }}>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="erp-input"
              style={{
                borderRadius: '9999px',
                background: 'linear-gradient(150deg, rgb(255 255 255 / 8%) 1%, rgb(0 17 89 / 65%) 73%, rgb(255 255 255 / 39%) 108%)',
                height: '38px',
                paddingLeft: '14px',
                paddingRight: '36px',
                boxShadow: 'rgba(0, 0, 0, 0.4) 3px 3px 6px, rgba(255, 255, 255, 0.05) -3px -3px 6px',
                border: '1px solid rgb(255 255 255 / 56%)',
                color: selectedStatus !== '' ? '#FFFFFF' : '#b9c8ddff',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                backgroundImage: \`url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23b9c8dd' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")\`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'calc(100% - 12px) center',
                backgroundSize: '16px',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <option value="" style={{ backgroundColor: '#101c44', color: '#FFF' }}>Todos los estados</option>
              <option value="1" style={{ backgroundColor: '#101c44', color: '#FFF' }}>Habilitados</option>
              <option value="0" style={{ backgroundColor: '#101c44', color: '#FFF' }}>Deshabilitados</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        {!isFreelancer && (
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flexDirection: 'column' }}>
              <button
                className="btn-secondary"
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                title="Imprimir listado">
                <img src={imgImprimir} alt="Imprimir" style={{ width: '20px', height: '20px' }} />
              </button>
              <span className='title-input'>Imprimir</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flexDirection: 'column' }}>
              <button
                className="btn-secondary"
                onClick={handleOpenCreate}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                title="Agregar nuevo mǸtodo">
                <img src={imgAgregar} alt="Agregar" style={{ width: '20px', height: '20px' }} />
              </button>
              <span className='title-input'>Agregar</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}`;

code = code.replace(headerRegex, newToolbar);

// 2. Fix the Table Container style
const tableContainerRegex = /<div\s*style=\{\{\s*background: 'rgba\(30, 41, 59, 0\.7\)',\s*border: '1px solid rgba\(255, 255, 255, 0\.1\)',\s*borderRadius: '16px',\s*overflow: 'hidden',\s*boxShadow: '0 10px 30px rgba\(0,0,0,0\.25\)',\s*\}\}>/;
const newTableContainer = `<div style={{
        background: 'rgba(188, 192, 215, 0.09)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      }}>`;
code = code.replace(tableContainerRegex, newTableContainer);

// 3. Fix the Table Header <tr> style
const theadTrRegex = /<tr style=\{\{\s*borderBottom: '1px solid rgba\(255, 255, 255, 0\.1\)'\s*\}\}>/;
const newTheadTr = `<tr style={{ background: '#e8721726', borderBottom: '1px solid rgba(255, 255, 255, 0.84)' }}>`;
code = code.replace(theadTrRegex, newTheadTr);

// Change <th> color to #FFFFFF
code = code.replace(/color: '#94A3B8'/g, "color: '#FFFFFF'");

// 4. Fix Action Buttons (Editar / Eliminar) in the table rows
// Replace the block inside <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
const actionsRegex = /\{\/\* Edit Button \*\/\}\s*<button[\s\S]*?\{\/\* Delete Button \*\/\}\s*<button[\s\S]*?<\/button>/;

const newActions = `{/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          title="Editar mǸtodo"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            color: '#F8FAFC',
                            fontSize: '0.8125rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          Editar
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handlePromptDelete(item)}
                          title="Eliminar mǸtodo"
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            color: '#F87171',
                            fontSize: '0.8125rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          Eliminar
                        </button>`;
code = code.replace(actionsRegex, newActions);

// Fix the container flex gap of actions if needed
code = code.replace(/<div style=\{\{ display: 'flex', alignItems: 'center', gap: '6px' \}\}>/, "<div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>");

fs.writeFileSync(file, code, 'utf8');
console.log("Updated MetodoPagoList");
