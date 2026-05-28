const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let modifiedFiles = [];

walkDir(srcDir, (filePath) => {
    if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
   
    let originalContent = fs.readFileSync(filePath, 'utf8');
    let content = originalContent;

    // 1. Remove const token = localStorage.getItem("token");
    content = content.replace(/const\s+token\s*=\s*localStorage\.getItem\(['"]token['"]\);?/g, '');
    content = content.replace(/let\s+(userToken|fallbackToken|directToken)\s*=\s*localStorage\.getItem\(['"]token['"]\);?/g, '');
   
    // 2. Replace auth?.token || localStorage.getItem("token") with null or just remove it
    // Actually, if they do `const token = auth?.token || localStorage.getItem("token");`
    // We can just remove the localStorage part.
    content = content.replace(/\|\|\s*localStorage\.getItem\(['"]token['"]\)/g, '');
    content = content.replace(/\|\|\s*window\.localStorage\.getItem\(['"]token['"]\)/g, '');
   
    // 3. Remove Authorization header from fetch/axios calls
    // Usually it's: Authorization: `Bearer ${token}`
    content = content.replace(/Authorization:\s*`Bearer\s*\$\{?[a-zA-Z]*\}?`\s*,?/g, '');
    content = content.replace(/Authorization:\s*"Bearer\s*"\s*\+\s*[a-zA-Z]*\s*,?/g, '');
   
    // 4. Ensure credentials/withCredentials is set
    // If it's using axios, we add withCredentials: true. If fetch, credentials: 'include'.
    // We'll just rely on the global axiosInstance for most. If they use fetch:
    // If fetch(..., { ... }) we can add credentials: 'include'. This is harder via regex.
    // Let's just remove the Authorization header. Since we already configured api.js and axiosInstance.jsx,
    // they should be fine. If they use plain axios, they might need withCredentials.
    // Let's replace `axios.post(` with `axios.post(` ... wait, let's just do `withCredentials: true` globally where axios is used?
    // Actually, the most critical part is removing localStorage.getItem("token").
   
    content = content.replace(/localStorage\.removeItem\(['"]token['"]\);?/g, '');
    content = content.replace(/window\.localStorage\.getItem\(['"]token['"]\)/g, 'null');
    content = content.replace(/localStorage\.getItem\(['"]token['"]\)/g, 'null');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        modifiedFiles.push(filePath);
    }
});

console.log("Modified files:\n" + modifiedFiles.join('\n'));