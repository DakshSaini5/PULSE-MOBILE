const fs = require('fs');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const importRegex = /import\s*{([^}]+)}\s*from\s*['"]react-native['"]/;
  
  // Need global replacement in case of multiple react-native imports, but usually it's just one.
  const match = content.match(importRegex);
  
  if (match && match[1].includes('SafeAreaView')) {
    let inner = match[1];
    inner = inner.replace(/,\s*SafeAreaView/, '');
    inner = inner.replace(/SafeAreaView\s*,/, '');
    inner = inner.replace(/SafeAreaView/, '');
    
    if (inner.trim() === '') {
      content = content.replace(match[0], '');
    } else {
      content = content.replace(match[0], `import {${inner}} from 'react-native'`);
    }
    
    content = `import { SafeAreaView } from 'react-native-safe-area-context';\n` + content;
    fs.writeFileSync(file, content);
  }
});
console.log('Done replacing SafeAreaView');
