
const { exec } = require('child_process');
const port = process.argv[2] || '5000';

console.log(`🔍 Buscando procesos en el puerto ${port}...`);

exec(`netstat -ano | findstr :${port}`, (error, stdout, stderr) => {
  if (error) {
    console.log(`✅ No se encontraron procesos en el puerto ${port}`);
    return;
  }

  const lines = stdout.split('\n').filter(line => line.trim());
  const pids = new Set();

  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length > 0) {
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid)) {
        pids.add(pid);
      }
    }
  });

  if (pids.size === 0) {
    console.log(`✅ No se encontraron procesos en el puerto ${port}`);
    return;
  }

  console.log(`🔴 Encontrados ${pids.size} proceso(s) en el puerto ${port}:`);
  pids.forEach(pid => console.log(`   PID: ${pid}`));

  pids.forEach(pid => {
    console.log(`🛑 Matando proceso ${pid}...`);
    exec(`taskkill /PID ${pid} /F`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error al matar el proceso ${pid}:`, error.message);
      } else {
        console.log(`✅ Proceso ${pid} terminado exitosamente`);
      }
    });
  });
});

