const engine = fs.readFileSync('src/utils/financialEngine.ts', 'utf8');
console.log(engine.match(/const autosaveKey = `savings_autosave_\${d}_\${d}`;[\s\S]*?if \(!isDiscarded\) \{/));
