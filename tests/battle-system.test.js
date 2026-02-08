/**
 * Battle System Comprehensive Test Suite (JS Version)
 * Run with: node tests/battle-system.test.js
 */

// Import battle engine (compiled)
const battleEngine = require('../workers/ghost-game/dist/utils/battle-engine.js');

const {
  BattleConfig, BattleUnit, BattleRound,
  DEFAULT_CONFIG, calculateDamage, calculateRewards, calculateWinRate,
  validateBattle, determineWinType, calculatePowerFromHeroes,
  generateBattleRounds, encodeBattleReplay, decodeBattleReplay,
  getSkillEffect, tryTriggerSkill, applySkillEffect,
  getUnitTypeBonus, getTypeBonusDescription, checkSkillCombo,
  applyComboEffect, initSkillCooldowns, updateSkillCooldowns,
  isSkillOnCooldown, setSkillCooldown, setSkillConfigs
} = battleEngine;

// Test utilities
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`❌ ASSERTION FAILED: ${message}`);
  }
  console.log(`✅ ${message}`);
  return true;
};

const testSection = (name) => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🧪 TEST SECTION: ${name}`);
  console.log('='.repeat(50));
};

// Mock configs
const mockSkillConfigs = {
  'attack_skills': [
    { id: 1, randomID: 101, name: '烈火斩', probability: 30, effID: 1, effectValue: 150 },
    { id: 2, randomID: 102, name: '爆燃', probability: 25, effID: 2, effectValue: 200 },
  ],
  'heal_skills': [
    { id: 3, randomID: 201, name: '治愈之光', probability: 40, effID: 3, effectValue: 100 },
  ]
};

const mockHeroConfigs = {
  Portrait: [
    { Index: 1, Name: '将军A', AbilityIndex: 1, Icon: 'icon_a.png' },
    { Index: 2, Name: '将军B', AbilityIndex: 2, Icon: 'icon_b.png' },
  ],
  Ability: [
    { Index: 1, Attack: 100, Defence: 80, MaxHp: 1000, Speed: 15, CritRate: 0.15, CritDamage: 1.5 },
    { Index: 2, Attack: 120, Defence: 60, MaxHp: 800, Speed: 20, CritRate: 0.2, CritDamage: 1.8 },
  ]
};

const createMockUnit = (overrides = {}) => ({
  id: 1,
  configId: 1,
  name: 'TestUnit',
  type: 1,
  attack: 100,
  defense: 50,
  hp: 1000,
  maxHp: 1000,
  speed: 10,
  critRate: 0.15,
  critDamage: 1.5,
  skill: [101, 102],
  position: 1,
  ...overrides,
});

function runBattleSystemTests() {
  console.log('\n🧪 Free-Node Web Battle System - Comprehensive Test Suite\n');
  
  let passed = 0;
  let failed = 0;

  try {
    setSkillConfigs(mockSkillConfigs);

    // 1. Battle Engine Core Tests
    testSection('Battle Engine Core');
    try {
      assert(DEFAULT_CONFIG.maxRounds === 10, 'DEFAULT_CONFIG has correct maxRounds');
      assert(DEFAULT_CONFIG.baseDamage === 100, 'DEFAULT_CONFIG has correct baseDamage');
      passed += 2;
    } catch (e) { console.log(`❌ ${e.message}`); failed++; }

    // 2. Battle Unit Tests
    testSection('Battle Unit');
    try {
      const unit = createMockUnit();
      assert(unit.id === 1, 'Unit has correct id');
      assert(unit.maxHp === 1000, 'Unit has correct maxHp');
      passed += 2;
    } catch (e) { console.log(`❌ ${e.message}`); failed++; }

    // 3. Damage Calculation Tests
    testSection('Damage Calculation');
    try {
      const attacker = createMockUnit({ attack: 100 });
      const defender = createMockUnit({ id: 2, defense: 50 });
      const result = calculateDamage(attacker, defender);
      assert(result.damage > 0, 'Basic damage is positive');
      
      const infantryAttacker = createMockUnit({ type: 1, attack: 100 });
      const cavalryDefender = createMockUnit({ id: 2, type: 2, defense: 50 });
      const typeBonusResult = calculateDamage(infantryAttacker, cavalryDefender);
      assert(typeBonusResult.bonus === 1.5, 'Infantry vs Cavalry bonus is 1.5x');
      passed += 2;
    } catch (e) { console.log(`❌ ${e.message}`); failed++; }

    // 4. Unit Type Bonus Tests
    testSection('Unit Type Bonus');
    try {
      assert(getUnitTypeBonus(1, 2) === 1.5, 'Infantry→Cavalry: +50%');
      assert(getUnitTypeBonus(2, 1) === 1.5, 'Cavalry→Infantry: +50%');
      assert(getUnitTypeBonus(3, 2) === 1.5, 'Archer→Cavalry: +50%');
      assert(getUnitTypeBonus(3, 1) === 1.3, 'Archer→Infantry: +30%');
      assert(getUnitTypeBonus(1, 1) === 1, 'Same type: no bonus');
      passed += 5;
    } catch (e) { console.log(`❌ ${e.message}`); failed++; }

    // 5. Skill System Tests
    testSection('Skill System');
    try {
      const skill = getSkillEffect(101);
      assert(skill !== null, 'Skill 101 found');
      if (skill) assert(skill.name === '烈火斩', 'Skill has correct name');
      passed += 1;
    } catch (e) { console.log(`❌ ${e.message}`); failed++; }

    // 6. Skill Cooldown Tests
    testSection('Skill Cooldowns');
    try {
      const cooldowns = initSkillCooldowns([101, 102, 201]);
      assert(cooldowns.length === 3, 'Cooldowns initialized for 3 skills');
      
      const withCooldown = setSkillCooldown(101, cooldowns);
      assert(isSkillOnCooldown(101, withCooldown) === true, 'Skill 101 is on cooldown');
      
      const updated = updateSkillCooldowns(withCooldown);
      assert(updated.find(c => c.skillId === 101)?.remainingRounds === 2, 'Cooldown decreased');
      passed += 3;
    } catch (e) { console.log(`❌ ${e.message}`); failed++; }

    // 7. Skill Combo Tests
    testSection('Skill Combos');
    try {
      const comboResult = checkSkillCombo([101, 102]);
      assert(comboResult.combo !== null, 'Combo detected');
      if (comboResult.combo) {
        assert(comboResult.combo.name === '火凤燎原', 'Combo has correct name');
        assert(comboResult.bonus === 1.5, 'Combo bonus is 1.5x');
      }
      passed += 2;
    } catch (e) { console.log(`❌ ${e.message}`); failed++; }

    // 8. Battle Rewards Tests
    testSection('Battle Rewards');
    try {
      const winRewards = calculateRewards(true, 2000, 'pve');
      assert(winRewards.exp > 0, 'Win gives EXP');
      assert(winRewards.gold > 0, 'Win gives gold');
      
      const loseRewards = calculateRewards(false, 2000, 'pve');
      assert(loseRewards.gold === 0, 'Lose gives no gold');
      
      const pvpWin = calculateRewards(true, 2000, 'pvp');
      assert(pvpWin.prestige > winRewards.prestige, 'PVP gives more prestige');
      passed += 4;
    } catch (e) { console.log(`❌ ${e.message}`); failed++; }

    // 9. Win Rate Tests
    testSection('Win Rate Calculation');
    try {
      const equalRate = calculateWinRate(1000, 1000);
      assert(equalRate === 0.5, 'Equal power = 50%');
      assert(calculateWinRate(2000, 1000) > 0.5, 'Higher power > 50%');
      assert(calculateWinRate(1000, 2000) < 0.5, 'Lower power < 50%');
      passed += 3;
    } catch (e) { console.log(`❌ ${e.message}`); failed++; }

    // 10. Battle Validation Tests
    testSection('Battle Validation');
    try {
      const validBattle = validateBattle(1000, 800, 3);
      assert(validBattle.valid === true, 'Valid battle passes');
      assert(validateBattle(1000, 800, 10).valid === false, 'Too large level diff fails');
      assert(validateBattle(10000, 500, 0).valid === false, 'Too large power diff fails');
      passed += 3;
    } catch (e) { console.log(`❌ ${e.message}`); failed++; }

    // 11. Battle Round Generation Tests
    testSection('Battle Round Generation');
    try {
      const rounds = generateBattleRounds(
        [createMockUnit({ id: 1, name: 'Attacker1' })],
        [createMockUnit({ id: 2, name: 'Defender1', type: 2 })],
        0, DEFAULT_CONFIG
      );
      assert(rounds.length > 0, 'Rounds generated');
      assert(rounds.length <= DEFAULT_CONFIG.maxRounds, 'Rounds within limit');
      passed += 2;
    } catch (e) { console.log(`❌ ${e.message}`); failed++; }

    // 12. Battle Replay Tests
    testSection('Battle Replay System');
    try {
      const attackerUnits = [createMockUnit({ id: 1, name: 'Attacker' })];
      const defenderUnits = [createMockUnit({ id: 2, name: 'Defender', type: 2 })];
      const rounds = generateBattleRounds(attackerUnits, defenderUnits, 0, DEFAULT_CONFIG);
      const winner = rounds[rounds.length - 1]?.winner || 'attacker';
      
      const encoded = encodeBattleReplay(rounds, attackerUnits, defenderUnits, winner);
      assert(typeof encoded === 'string', 'Encoded replay is string');
      
      const decoded = decodeBattleReplay(encoded);
      assert(decoded !== null, 'Decoded replay is not null');
      if (decoded) {
        assert(decoded.rounds.length === rounds.length, 'Rounds match');
      }
      
      assert(decodeBattleReplay('invalid!!!') === null, 'Invalid replay returns null');
      passed += 4;
    } catch (e) { console.log(`❌ ${e.message}`); failed++; }

    // 13. Power Calculation Tests
    testSection('Power Calculation');
    try {
      const heroes = [
        { id: 1, config_id: 1, quality: 1, level: 1 },
        { id: 2, config_id: 2, quality: 2, level: 5 },
      ];
      const power = calculatePowerFromHeroes(heroes, mockHeroConfigs);
      assert(power > 0, 'Power calculation returns positive');
      passed += 1;
    } catch (e) { console.log(`❌ ${e.message}`); failed++; }

    // Summary
    console.log(`\n${'='.repeat(50)}`);
    console.log('📊 BATTLE SYSTEM TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(50));
    
    return { passed, failed, successRate: (passed / (passed + failed)) * 100 };
  } catch (e) {
    console.error(`\n💥 CRITICAL ERROR: ${e.message}`);
    return { passed, failed: 999, successRate: 0 };
  }
}

// Run
const result = runBattleSystemTests();
process.exit(result.failed > 0 ? 1 : 0);
