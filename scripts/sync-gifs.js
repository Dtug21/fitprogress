const fs = require('fs');
const https = require('https');
const path = require('path');

const DB_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json';
const GIF_BASE_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/';
const ASSETS_DIR = path.join(__dirname, '../assets/exercise-gifs');
const EXERCISES_FILE = path.join(__dirname, '../data/exercises.ts');

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Map local IDs to exact names or keywords in the DB
const MANUAL_MAP = {
  push_up_knee: 'push-up (on knees)',
  push_up_standard: 'push-up',
  push_up_band: 'resistance band push-up',
  floor_press_db: 'dumbbell floor press',
  floor_press_barbell: 'barbell floor press',
  chest_fly_db: 'dumbbell fly',
  incline_press_db: 'dumbbell incline bench press',
  chest_press_machine: 'lever seated chest press',
  bench_press_db: 'dumbbell bench press',
  bench_press_barbell: 'barbell bench press',
  incline_press_barbell: 'barbell incline bench press',
  cable_fly: 'cable crossover',
  weighted_dips: 'triceps dip',
  band_pull_apart: 'band pull apart',
  bent_over_row_db: 'dumbbell bent over row',
  bent_over_row_barbell: 'barbell bent over row',
  deadlift_barbell: 'barbell deadlift',
  deadlift_db: 'dumbbell deadlift',
  deadlift_heavy: 'barbell deadlift',
  lat_pulldown: 'cable lat pulldown',
  cable_row: 'cable seated row',
  pull_up: 'pull-up',
  weighted_pull_up: 'weighted pull-up',
  deadlift_gym: 'barbell deadlift',
  band_lateral_raise: 'band lateral raise',
  lateral_raise_db: 'dumbbell lateral raise',
  overhead_press_db: 'dumbbell seated shoulder press',
  overhead_press_barbell: 'barbell standing military press',
  arnold_press: 'dumbbell arnold press',
  shoulder_press_machine: 'lever shoulder press',
  overhead_press_barbell_gym: 'barbell seated overhead press',
  push_press: 'barbell push press',
  face_pull: 'cable face pull',
  band_curl: 'band biceps curl',
  hammer_curl_db: 'dumbbell hammer curl',
  bicep_curl_db: 'dumbbell bicep curl',
  ez_bar_curl: 'ez barbell curl',
  w_bar_curl: 'ez barbell curl',
  barbell_curl: 'barbell curl',
  preacher_curl: 'barbell preacher curl',
  cable_curl: 'cable standing bicep curl',
  diamond_push_up: 'diamond push-up',
  tricep_kickback_db: 'dumbbell tricep kickback',
  skull_crusher_ez: 'ez bar skullcrusher',
  overhead_tricep_extension: 'dumbbell standing triceps extension',
  cable_pushdown: 'cable triceps pushdown',
  skull_crusher_barbell: 'barbell lying triceps extension',
  close_grip_bench: 'barbell close grip bench press',
  bodyweight_squat: 'bodyweight squat',
  goblet_squat: 'dumbbell goblet squat',
  bulgarian_split_squat: 'dumbbell bulgarian split squat',
  lunge_db: 'dumbbell lunge',
  sumo_deadlift_db: 'dumbbell sumo deadlift',
  romanian_deadlift_db: 'dumbbell romanian deadlift',
  hip_thrust_db: 'dumbbell hip thrust',
  glute_bridge: 'glute bridge',
  calf_raise_bodyweight: 'bodyweight standing calf raise',
  calf_raise_db: 'dumbbell standing calf raise',
  leg_press_machine: 'sled leg press',
  barbell_squat: 'barbell squat',
  barbell_squat_heavy: 'barbell squat',
  leg_curl_machine: 'lever seated leg curl',
  romanian_deadlift_gym: 'barbell romanian deadlift',
  hip_thrust_barbell: 'barbell hip thrust',
  calf_raise_machine: 'lever standing calf raise',
  plank: 'front plank',
  dead_bug: 'dead bug',
  ab_wheel_rollout: 'ab wheel rollout',
  ab_wheel_standing: 'ab wheel rollout',
  russian_twist: 'russian twist',
  hanging_leg_raise: 'hanging leg raise',
  jump_rope: 'jump rope',
  jump_rope_double_under: 'jump rope',
  burpees: 'burpee',
  treadmill: 'walking on incline treadmill',
  hiit_treadmill: 'run on treadmill',
  donkey_kick: 'donkey kick',
  fire_hydrant: 'fire hydrant',
  cable_kickback: 'cable standing glute kickback',
  abduction_machine: 'lever seated hip abduction',
  sumo_squat_barbell: 'barbell sumo squat',
  leg_extension_machine: 'lever leg extension',
  hack_squat_machine: 'sled hack squat',
  step_up_db: 'dumbbell step-up',
  wall_sit: 'wall sit',
  walking_lunge_barbell: 'barbell walking lunge',
  nordic_hamstring_curl: 'nordic hamstring curl',
  chin_up: 'chin-up',
  single_arm_row_db: 'dumbbell one arm row',
  t_bar_row: 't-bar row',
  pullover_db: 'dumbbell pullover',
  hyperextension: 'hyperextension',
  front_raise_db: 'dumbbell front raise',
  rear_delt_fly_db: 'dumbbell rear delt fly',
  upright_row_barbell: 'barbell upright row',
  concentration_curl_db: 'dumbbell concentration curl',
  incline_curl_db: 'dumbbell incline curl',
  bench_dip: 'bench dip',
  cable_overhead_tricep: 'cable overhead triceps extension',
  crunch: 'crunch',
  sit_up: 'sit-up',
  bicycle_crunch: 'bicycle crunch',
  leg_raise_lying: 'lying leg raise',
  side_plank: 'side plank',
  mountain_climber: 'mountain climber',
  box_jump: 'box jump',
  rowing_machine: 'rowing machine'
};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function run() {
  console.log('Fetching ExerciseDB JSON...');
  const db = await fetchJson(DB_URL);
  console.log(`Loaded ${db.length} exercises from remote DB.`);

  // Extract our IDs
  const content = fs.readFileSync(EXERCISES_FILE, 'utf8');
  const idMatches = content.match(/id: '([^']+)'/g);
  const myIds = idMatches.map(str => str.replace(/id: '|'/g, ''));
  console.log(`Found ${myIds.length} local exercises.`);

  const gifEntries = [];

  for (const id of myIds) {
    const targetName = MANUAL_MAP[id] || id.replace(/_/g, ' ');
    
    // Exact or partial match
    let match = db.find(e => e.name.toLowerCase() === targetName.toLowerCase());
    if (!match) {
      match = db.find(e => e.name.toLowerCase().includes(targetName.toLowerCase()));
    }
    
    if (match && match.gif_url) {
      const gifUrl = GIF_BASE_URL + match.gif_url;
      const destPath = path.join(ASSETS_DIR, `${id}.gif`);
      
      console.log(`Downloading GIF for [${id}] -> matched with "${match.name}"`);
      await downloadFile(gifUrl, destPath);
      gifEntries.push(`  ${id}: require('../assets/exercise-gifs/${id}.gif'),`);
    } else {
      console.log(`⚠️ No match found for [${id}] - searched for "${targetName}"`);
    }
  }

  // Generate exercise-gifs.ts
  const exportContent = `const EXERCISE_GIFS: Record<string, number> = {
${gifEntries.join('\n')}
};

export default EXERCISE_GIFS;
`;

  fs.writeFileSync(path.join(__dirname, '../data/exercise-gifs.ts'), exportContent, 'utf8');
  console.log('✅ Sync completed! exercise-gifs.ts generated.');
}

run().catch(console.error);
