const fs = require('fs');
const exData = fs.readFileSync('data/exercises.ts', 'utf8');
const gifData = fs.readFileSync('data/exercise-gifs.ts', 'utf8');

const idMatches = exData.match(/id:\s*['"][a-zA-Z0-9_]+['"]/g);
const numExercises = idMatches ? idMatches.length : 0;

const gifMatches = gifData.match(/[a-zA-Z0-9_]+:\s*require/g);
const numGifs = gifMatches ? gifMatches.length : 0;

console.log('Total Ejercicios:', numExercises);
console.log('Total Animaciones:', numGifs);
