import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const vars = path.join(root, 'android', 'variables.gradle');
if (fs.existsSync(vars)) {
  let s = fs.readFileSync(vars, 'utf8');
  s = s.replace(/compileSdkVersion\s*=\s*\d+/, 'compileSdkVersion = 36');
  s = s.replace(/targetSdkVersion\s*=\s*\d+/, 'targetSdkVersion = 36');
  fs.writeFileSync(vars, s);
}
const manifest = path.join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifest)) {
  let s = fs.readFileSync(manifest, 'utf8');
  if (!s.includes('android:usesCleartextTraffic')) s = s.replace('<application ', '<application android:usesCleartextTraffic="false" ');
  fs.writeFileSync(manifest, s);
}
console.log('Android project prepared for target API 36.');
