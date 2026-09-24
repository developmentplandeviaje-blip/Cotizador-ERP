import os
import re

file_path = 'react-frontend/src/components/catalog/traslados/TrasladoModal.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix literal unicode
content = content.replace('Descripci\\u00f3n', 'Descripción')

# Replace radio buttons Privado/Compartido to Solo Ida/Ida y Vuelta
content = re.sub(
    r'value="privado"\s+checked=\{tipoServicio === \'privado\'\}',
    'value="Solo Ida"\n                  checked={tipoServicio === \'Solo Ida\'}',
    content
)
content = content.replace('>                 Privado', '>                 Solo Ida')

content = re.sub(
    r'value="compartido"\s+checked=\{tipoServicio === \'compartido\'\}',
    'value="Ida y Vuelta"\n                  checked={tipoServicio === \'Ida y Vuelta\'}',
    content
)
content = content.replace('>                 Compartido', '>                 Ida y Vuelta')

# Fix initial state
content = content.replace("setTipoServicio('privado')", "setTipoServicio('Solo Ida')")
content = content.replace("useState('privado')", "useState('Solo Ida')")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Modal fixed")
