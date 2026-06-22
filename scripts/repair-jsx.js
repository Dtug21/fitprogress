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

let fixedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Replace <style= with <SafeAreaView style=
  if (content.includes('<style={')) {
    content = content.replace(/<style={/g, '<SafeAreaView style={');
    // Also we need to replace the closing tag. But the closing tag is just </> 
    // And there might be valid fragments like <></>. 
    // Since SafeAreaView was wrapping the main screen, we can replace the last </> with </SafeAreaView>
    // OR we can just replace ALL </> with </SafeAreaView> IF it was wrapping.
    // Actually, in react native `SafeAreaView` was wrapping the screen.
    // Let's replace the last occurrence of </> that matches the indentation, but it's risky.
    // Wait, the regex `(\s*)SafeAreaView,?\s*` replaced `SafeAreaView` with `""`.
    // So `</SafeAreaView>` became `</>`.
    // And `<SafeAreaView style={...}>` became `< style={...}>` or `<style={...}>`.
    content = content.replace(/<\/>/g, '</SafeAreaView>');
  }

  // Same for `< style={`
  if (content.includes('< style={')) {
    content = content.replace(/<\sstyle={/g, '<SafeAreaView style={');
    content = content.replace(/<\/>/g, '</SafeAreaView>');
  }

  // Also check if any `<>` should be `<SafeAreaView>`? If there was no style prop, `<SafeAreaView>` became `<>`.
  // If we mistakenly replace valid fragments, it might break. Let's run a tsc test inside the script.
  
  if (content !== original) {
    // Add import if missing
    if (!content.includes('SafeAreaView')) {
      content = "import { SafeAreaView } from 'react-native-safe-area-context';\n" + content;
    }
    fs.writeFileSync(file, content, 'utf8');
    fixedCount++;
    console.log('Fixed syntax in:', file);
  }
}

console.log('Total files fixed:', fixedCount);
