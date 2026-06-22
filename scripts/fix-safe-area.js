const fs = require('fs');
const path = require('path');

const walk = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.expo' && file !== '.git') {
        fileList = walk(path.join(dir, file), fileList);
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        fileList.push(path.join(dir, file));
      }
    }
  }
  return fileList;
};

const appDir = path.join(__dirname, '../app');
const files = walk(appDir);

let modifiedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Si tiene SafeAreaView desde react-native
  if (content.includes('SafeAreaView') && content.match(/import\s+{[^}]*SafeAreaView[^}]*}\s+from\s+['"]react-native['"]/)) {
    // 1. Quitar SafeAreaView del import de react-native
    content = content.replace(/(\s*)SafeAreaView,?\s*/g, (match, p1) => {
      // Si hay espacios antes, mantenerlos si no es el primer item, pero es complicado con regex simple.
      // Mejor abordaje:
      return '';
    });
    
    // Si quedó un import vacío tipo import { } from 'react-native', lo arreglaremos luego,
    // o simplemente quitamos SafeAreaView cuidadosamente.
    
    // Volver a leer para arreglar comas sueltas
    content = content.replace(/{\s*,/g, '{ ').replace(/,\s*}/g, ' }').replace(/,\s*,/g, ',');
    
    // Si el import de react-native quedó vacío import { } from 'react-native';
    content = content.replace(/import\s+{\s*}\s+from\s+['"]react-native['"];?\n?/, '');

    // 2. Agregar import { SafeAreaView } from 'react-native-safe-area-context'; al principio del archivo (después del primer import o similar)
    // O mejor insertarlo después de los imports de react-native
    const reactNativeImportRegex = /import\s+{[^}]*}\s+from\s+['"]react-native['"];?/;
    if (reactNativeImportRegex.test(content)) {
      content = content.replace(reactNativeImportRegex, (match) => {
        return match + '\nimport { SafeAreaView } from \'react-native-safe-area-context\';';
      });
    } else {
      // Si borramos el import de react-native porque estaba vacío
      content = 'import { SafeAreaView } from \'react-native-safe-area-context\';\n' + content;
    }
    
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log('Modified:', file);
  } else if (content.includes('SafeAreaView') && /import.*react-native/.test(content) && !content.includes('react-native-safe-area-context')) {
     // A veces SafeAreaView está en una sola línea: import { View, SafeAreaView } from 'react-native';
     // Regex más específico:
     const rx = /import\s+{[^}]*SafeAreaView[^}]*}\s+from\s+['"]react-native['"];?/s;
     if (rx.test(content)) {
        content = content.replace(rx, match => {
           let newMatch = match.replace(/SafeAreaView,?\s*/, '');
           newMatch = newMatch.replace(/{\s*,/, '{').replace(/,\s*}/, '}');
           if (/{\s*}/.test(newMatch)) {
             return 'import { SafeAreaView } from \'react-native-safe-area-context\';';
           }
           return newMatch + '\nimport { SafeAreaView } from \'react-native-safe-area-context\';';
        });
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
        console.log('Modified (fallback regex):', file);
     }
  }
}

console.log('Total files modified:', modifiedCount);
