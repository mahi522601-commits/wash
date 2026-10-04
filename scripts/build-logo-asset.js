import fs from 'fs';
import path from 'path';

const logoPath = path.join(process.cwd(), 'public', 'techwashlogo.webp');
const buf = fs.readFileSync(logoPath);
const base64 = buf.toString('base64');

const code = `// Embedded Tech Wash Logo PNG Buffer for Serverless PDF Generator
const LOGO_BASE64 = "${base64}";
export const TECH_WASH_LOGO_BUFFER = Buffer.from(LOGO_BASE64, 'base64');
`;

fs.writeFileSync(path.join(process.cwd(), 'api', '_utils', 'logoAsset.js'), code);
console.log('✅ api/_utils/logoAsset.js created successfully with embedded logo buffer.');
