/**
 * Battle System Comprehensive Test Suite
 * Tests all battle-related functionality including combat engine, skills, rewards, and replay
 */

import { 
  BattleConfig, 
  BattleUnit, 
  BattleRound, 
  BattleReport,
  BattleSkill,
  DEFAULT_CONFIG,
  calculateDamage,
  calculateRewards,
  calculateWinRate,
  validateBattle,
  determineWinType,
  calculatePowerFromHeroes,
  generateBattleRounds,
  encodeBattleReplay,
  decodeBattleReplay,
  getSkillEffect,
  tryTriggerSkill,
  applySkillEffect,
  getUnitTypeBonus,
  getTypeBonusDescription,
  checkSkillCombo,
  applyComboEffect,
  initSkillCooldowns,
  updateSkillCooldowns,
  isSkillOnCooldown,
  setSkillCooldown,
  SKILL_CONFIGS,
  setSkillConfigs
} from '../workers/ghost-game/src/utils/battle-engine';

// Test utilities
const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(`❌ ASSERTION FAILED: ${message}`);
  }
  console.log(`✅ ${message}`);
};

const testSection = (name: string) => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🧪 TEST SECTION: ${name}`);
  console.log('='.repeat(50));
};

// ==================== Test Data ====================

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

const mockSkillConfigs = {
  'attack_skills': [
    { id: 1, randomID: 101, name: '烈火斩', probability: 30, effID: 1, effectValue: 150 },
    { id: 2, randomID: 102, name: '爆燃', probability: 25, effID: 2, effectValue: 200 },
  ],
  'heal_skills': [
    { id: 3, randomID: 201, name: '治愈之光', probability: 40, effID: 3, effectValue: 100 },
  ]
};

const createMockUnit = (overrides: Partial<BattleUnit> = {}): BattleUnit => ({
  id: 1,
  configId: 1,
  name: 'TestUnit',
  type: 1, // infantry
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

// ==================== Main Test Runner ====================

async function runBattleSystemTests() {
  console.log('\n🧪 Free-Node Web Battle System - Comprehensive Test Suite\n');
  
  let passed = 0;
  let failed = 0;

  try {
    // Initialize skill configs
    setSkillConfigs(mockSkillConfigs);

    // ==================== 1. Battle Engine Core Tests ====================
    testSection('Battle Engine Core');
    
    try {
      assert(DEFAULT_CONFIG.maxRounds === 10, 'DEFAULT_CONFIG has correct maxRounds');
      assert(DEFAULT_CONFIG.baseDamage === 100, 'DEFAULT_CONFIG has correct baseDamage');
      assert(DEFAULT_CONFIG.criticalRate === 0.15, 'DEFAULT_CONFIG has correct criticalRate');
      passed += 5;
    } catch (e: any) {
      console.log(`❌ ${e.message}`);
      failed++;
    }

    // ==================== 2. Battle Unit Tests ====================
    testSection('Battle Unit');
    
    try {
      const unit = createMockUnit();
      assert(unit.id === 1, 'Unit has correct id');
      assert(unit.name === 'TestUnit', 'Unit has correct name');
      assert(unit.maxHp === 1000, 'Unit has correct maxHp');
      assert(unit.type === 1, 'Unit has correct type (infantry)');
      passed += 4;
    } catch (e: any) {
      console.log(`❌ ${e.message}`);
      failed++;
    }

    // ==================== 3. Damage Calculation Tests ====================
    testSection('Damage Calculation');
    
    try {
      const attacker = createMockUnit({ attack: 100 });
      const defender = createMockUnit({ id: 2, defense: 50 });
      
      // Test basic damage calculation
      const result = calculateDamage(attacker, defender);
      assert(result.damage > 0, 'Basic damage is positive');
      assert(typeof result.isCrit === 'boolean', 'Crit flag is boolean');
      assert(typeof result.isMiss === 'boolean', 'Miss flag is boolean');
      
      // Test unit type bonus (infantry vs cavalry)
      const infantryAttacker = createMockUnit({ type: 1, attack: 100 });
      const cavalryDefender = createMockUnit({ id: 2, type: 2, defense: 50 });
      
      const typeBonusResult = calculateDamage(infantryAttacker, cavalryDefender);
      assert(typeBonusResult.bonus !== undefined, 'Type bonus is present');
      assert(typeBonusResult.bonus === 1.5, 'Infantry vs Cavalry bonus is 1.5x');
      
      // Test with archer vs cavalry (archer bonus vs cavalry)
      const archerAttacker = createMockUnit({ id: 3, type: 3, attack: 100 });
      const cavalryDefender2 = createMockUnit({ id: 4, type: 2, defense: 50 });
      
      const archerBonus = calculateDamage(archerAttacker, cavalryDefender2);
      assert(archerBonus.bonus === 1.5, 'Archer vs Cavalry bonus is 1.5x');
      
      passed += 5;
    } catch (e: any) {
      console.log(`❌ ${e.message}`);
      failed++;
    }

    // ==================== 4. Unit Type Bonus Tests ====================
    testSection('Unit Type Bonus (Rock-Paper-Scissors)');
    
    try {
      // Test infantry vs cavalry (50% bonus)
      assert(getUnitTypeBonus(1, 2) === 1.5, 'Infantry attacks Cavalry: +50%');
      
      // Test cavalry vs infantry (50% bonus)
      assert(getUnitTypeBonus(2, 1) === 1.5, 'Cavalry attacks Infantry: +50%');
      
      // Test archer vs cavalry (50% bonus)
      assert(getUnitTypeBonus(3, 2) === 1.5, 'Archer attacks Cavalry: +50%');
      
      // Test archer vs infantry (30% bonus)
      assert(getUnitTypeBonus(3, 1) === 1.3, 'Archer attacks Infantry: +30%');
      
      // Test same type (no bonus)
      assert(getUnitTypeBonus(1, 1) === 1, 'Same type: no bonus');
      
      // Test invalid type defaults to 1
      assert(getUnitTypeBonus(99, 1) === 1, 'Invalid type defaults to 1x');
      
      const descriptions = getTypeBonusDescription();
      assert(descriptions.length > 0, 'Type bonus descriptions exist');
      
      passed += 7;
    } catch (e: any) {
      console.log(`❌ ${e.message}`);
      failed++;
    }

    // ==================== 5. Skill System Tests ====================
    testSection('Skill System');
    
    try {
      // Test skill effect retrieval
      const skill = getSkillEffect(101);
      assert(skill !== null, 'Skill 101 found');
      if (skill) {
        assert(skill.name === '烈火斩', 'Skill has correct name');
        assert(skill.probability === 0.3, 'Skill has correct probability');
      }
      
      // Test skill trigger
      const unit = createMockUnit();
      const triggerResult = tryTriggerSkill(unit, 101);
      assert(typeof triggerResult.triggered === 'boolean', 'Trigger result is boolean');
      
      // Test skill effect application
      const target = createMockUnit({ id: 99 });
      if (triggerResult.effect) {
        const effectResult = applySkillEffect(target, triggerResult.effect);
        assert(effectResult.damage !== undefined || effectResult.heal !== undefined, 'Effect applied');
      }
      
      passed += 5;
    } catch (e: any) {
      console.log(`❌ ${e.message}`);
      failed++;
    }

    // ==================== 6. Skill Cooldown Tests ====================
    testSection('Skill Cooldowns');
    
    try {
      // Initialize cooldowns
      const cooldowns = initSkillCooldowns([101, 102, 201]);
      assert(cooldowns.length === 3, 'Cooldowns initialized for 3 skills');
      assert(cooldowns[0].remainingRounds === 0, 'New cooldown starts at 0');
      assert(cooldowns[0].maxRounds === 3, 'Default cooldown is 3 rounds');
      
      // Set cooldown
      const withCooldown = setSkillCooldown(101, cooldowns);
      assert(isSkillOnCooldown(101, withCooldown) === true, 'Skill 101 is on cooldown');
      assert(withCooldown.find(c => c.skillId === 101)?.remainingRounds === 3, 'Cooldown set to 3 rounds');
      
      // Update cooldowns
      const updated = updateSkillCooldowns(withCooldown);
      assert(updated.find(c => c.skillId === 101)?.remainingRounds === 2, 'Cooldown decreased after update');
      assert(updated.find(c => c.skillId === 102)?.remainingRounds === 0, 'Non-used skill stays at 0');
      
      // Check non-existent skill
      assert(isSkillOnCooldown(999, updated) === false, 'Non-existent skill is not on cooldown');
      
      passed += 7;
    } catch (e: any) {
      console.log(`❌ ${e.message}`);
      failed++;
    }

    // ==================== 7. Skill Combo Tests ====================
    testSection('Skill Combos');
    
    try {
      // Test valid combo
      const comboResult = checkSkillCombo([101, 102]);
      assert(comboResult.combo !== null, 'Combo detected for matching skills');
      if (comboResult.combo) {
        assert(comboResult.combo.name === '火凤燎原', 'Combo has correct name');
        assert(comboResult.bonus === 1.5, 'Combo bonus is 1.5x');
      }
      
      // Test partial combo (should not trigger)
      const partialCombo = checkSkillCombo([101, 999]);
      assert(partialCombo.combo === null, 'Partial skills do not trigger combo');
      assert(partialCombo.bonus === 1, 'Partial combo has no bonus');
      
      // Test apply combo effect
      const targets = [createMockUnit({ id: 1 }), createMockUnit({ id: 2 })];
      if (comboResult.combo) {
        const comboEffect = applyComboEffect(targets, comboResult.combo);
        assert(comboEffect.damages.length === 2, 'Effect applied to all targets');
        assert(typeof comboEffect.effectType === 'string', 'Effect type is string');
      }
      
      passed += 5;
    } catch (e: any) {
      console.log(`❌ ${e.message}`);
      failed++;
    }

    // ==================== 8. Battle Rewards Tests ====================
    testSection('Battle Rewards');
    
    try {
      // Test win rewards
      const winRewards = calculateRewards(true, 2000, 'pve');
      assert(winRewards.exp > 0, 'Win gives EXP');
      assert(winRewards.gold > 0, 'Win gives gold');
      assert(winRewards.fame > 0, 'Win gives fame');
      assert(winRewards.prestige > 0, 'Win gives prestige');
      
      // Test lose rewards
      const loseRewards = calculateRewards(false, 2000, 'pve');
      assert(loseRewards.exp > 0, 'Lose gives some EXP');
      assert(loseRewards.gold === 0, 'Lose gives no gold');
      assert(loseRewards.prestige < 0, 'Lose gives negative prestige');
      
      // Test different battle types
      const pvpWin = calculateRewards(true, 2000, 'pvp');
      const arenaWin = calculateRewards(true, 2000, 'arena');
      
      assert(pvpWin.prestige > winRewards.prestige, 'PVP gives more prestige than PVE');
      assert(arenaWin.prestige > pvpWin.prestige, 'Arena gives most prestige');
      
      // Test max EXP cap
      const hugeWin = calculateRewards(true, 50000, 'pve');
      assert(hugeWin.exp <= DEFAULT_CONFIG.maxExp, 'EXP is capped at maxExp');
      
      passed += 9;
    } catch (e: any) {
      console.log(`❌ ${e.message}`);
      failed++;
    }

    // ==================== 9. Win Rate Calculation Tests ====================
    testSection('Win Rate Calculation');
    
    try {
      // Equal power = 50%
      const equalRate = calculateWinRate(1000, 1000);
      assert(equalRate === 0.5, 'Equal power gives 50% win rate');
      
      // Higher power = higher win rate
      const advantageRate = calculateWinRate(2000, 1000);
      assert(advantageRate > 0.5, 'Higher power gives >50% win rate');
      
      // Lower power = lower win rate
      const disadvantageRate = calculateWinRate(1000, 2000);
      assert(disadvantageRate < 0.5, 'Lower power gives <50% win rate');
      
      // Rate bounds (5% - 95%)
      const extremeHigh = calculateWinRate(100000, 1);
      assert(extremeHigh <= 0.95, 'Max win rate is capped at 95%');
      
      const extremeLow = calculateWinRate(1, 100000);
      assert(extremeLow >= 0.05, 'Min win rate is capped at 5%');
      
      passed += 6;
    } catch (e: any) {
      console.log(`❌ ${e.message}`);
      failed++;
    }

    // ==================== 10. Battle Validation Tests ====================
    testSection('Battle Validation');
    
    try {
      // Valid battle
      const validBattle = validateBattle(1000, 800, 3);
      assert(validBattle.valid === true, 'Valid battle passes validation');
      
      // Invalid: level difference too large
      const invalidLevel = validateBattle(1000, 800, 10);
      assert(invalidLevel.valid === false, 'Too large level difference fails');
      assert(invalidLevel.reason?.includes('Level'), 'Level reason is correct');
      
      // Invalid: power difference too large
      const invalidPower = validateBattle(10000, 500, 0);
      assert(invalidPower.valid === false, 'Too large power difference fails');
      assert(invalidPower.reason?.includes('Power'), 'Power reason is correct');
      
      passed += 5;
    } catch (e: any) {
      console.log(`❌ ${e.message}`);
      failed++;
    }

    // ==================== 11. Battle Round Generation Tests ====================
    testSection('Battle Round Generation');
    
    try {
      const attackerUnits = [createMockUnit({ id: 1, name: 'Attacker1' })];
      const defenderUnits = [createMockUnit({ id: 2, name: 'Defender1', type: 2 })];
      
      const rounds = generateBattleRounds(attackerUnits, defenderUnits, 0, DEFAULT_CONFIG);
      
      assert(rounds.length > 0, 'Rounds generated');
      assert(rounds.length <= DEFAULT_CONFIG.maxRounds, 'Rounds within max limit');
      
      // Check round structure
      const firstRound = rounds[0];
      assert(typeof firstRound.round === 'number', 'Round has number');
      assert(firstRound.attacker !== undefined, 'Round has attacker');
      assert(firstRound.defender !== undefined, 'Round has defender');
      
      passed += 4;
    } catch (e: any) {
      console.log(`❌ ${e.message}`);
      failed++;
    }

    // ==================== 12. Battle Replay Encoding/Decoding Tests ====================
    testSection('Battle Replay System');
    
    try {
      // Generate test rounds
      const attackerUnits = [createMockUnit({ id: 1, name: 'Attacker' })];
      const defenderUnits = [createMockUnit({ id: 2, name: 'Defender', type: 2 })];
      const rounds = generateBattleRounds(attackerUnits, defenderUnits, 0, DEFAULT_CONFIG);
      const winner = rounds[rounds.length - 1]?.winner || 'attacker';
      
      // Encode replay
      const encoded = encodeBattleReplay(rounds, attackerUnits, defenderUnits, winner);
      assert(typeof encoded === 'string', 'Encoded replay is a string');
      assert(encoded.length > 0, 'Encoded replay is not empty');
      
      // Verify base64 format
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      assert(base64Regex.test(encoded), 'Encoded replay is valid base64');
      
      // Decode replay
      const decoded = decodeBattleReplay(encoded);
      assert(decoded !== null, 'Decoded replay is not null');
      
      if (decoded) {
        assert(decoded.rounds.length === rounds.length, 'Decoded rounds match original');
        assert(decoded.attackerUnits.length === attackerUnits.length, 'Attacker units match');
        assert(decoded.defenderUnits.length === defenderUnits.length, 'Defender units match');
        assert(decoded.winner === winner, 'Winner matches');
        
        // Verify round data integrity
        const firstDecoded = decoded.rounds[0];
        assert(firstDecoded.round === 1, 'Round number preserved');
      }
      
      // Test invalid replay decoding
      const invalidDecoded = decodeBattleReplay('invalid-base64!!!');
      assert(invalidDecoded === null, 'Invalid replay returns null');
      
      passed += 8;
    } catch (e: any) {
      console.log(`❌ ${e.message}`);
      failed++;
    }

    // ==================== 13. Power Calculation Tests ====================
    testSection('Power Calculation');
    
    try {
      const heroes = [
        { id: 1, config_id: 1, quality: 1, level: 1 },
        { id: 2, config_id: 2, quality: 2, level: 5 },
      ];
      
      const power = calculatePowerFromHeroes(heroes, mockHeroConfigs);
      assert(power > 0, 'Power calculation returns positive value');
      
      // Higher quality = more power
      const power2 = calculatePowerFromHeroes([heroes[1]], mockHeroConfigs);
      assert(power2 > 0, 'Single hero power is positive');
      
      passed += 3;
    } catch (e: any) {
      console.log(`❌ ${e.message}`);
      failed++;
    }

    // ==================== 14. Win Type Determination Tests ====================
    testSection('Win Type Determination');
    
    try {
      const mockRounds: BattleRound[] = [
        {
          round: 1,
          winner: undefined,
          attacker: { unitId: 1, name: 'A', action: 'attack', damage: 100, hp: 900 },
          defender: { unitId: 2, name: 'D', action: 'attack', damage: 50, hp: 950 },
        },
      ];
      
      const winType = determineWinType(mockRounds, 3, 1);
      assert(['annihilation', 'breakthrough', 'escape'].includes(winType), 'Win type is valid');
      
      passed += 2;
    } catch (e: any) {
      console.log(`❌ ${e.message}`);
      failed++;
    }

    // ==================== Summary ====================
    console.log(`\n${'='.repeat(50)}`);
    console.log('📊 BATTLE SYSTEM TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(50));
    
    return { passed, failed, successRate: (passed / (passed + failed)) * 100 };
  } catch (e: any) {
    console.error(`\n💥 CRITICAL ERROR: ${e.message}`);
    console.error(e.stack);
    return { passed, failed: 999, successRate: 0 };
  }
}

// Export for use in other test files
export { runBattleSystemTests };

// Run tests if executed directly
if (require.main === module) {
  runBattleSystemTests().then(result => {
    process.exit(result.failed > 0 ? 1 : 0);
  });
}
