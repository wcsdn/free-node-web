// ========== 存档系统 ==========
const SaveSystem = {
    SAVE_KEY: 'colorRPG_saveData',
    
    // 获取默认玩家数据
    getDefaultPlayerData() {
        return {
            life: 100,
            life_max: 100,
            act: 50,
            act_max: 50,
            atk: 10,
            atk_max: 10,
            def: 10,
            def_max: 300,
            rpe: 10,
            exp: 0,
            exp_max: 100,
            lv: 1,
            gold: 0,
            key: 0,
            key2: 0,
            combo: 0,
            addP: 0,
            neko: [0,0,0,0,0,0,0,0]
        };
    },
    
    // 保存游戏数据
    save(game) {
        const saveData = {
            version: 1,
            timestamp: Date.now(),
            selectedMap: localStorage.getItem('selectedMap') || '1',
            player: {
                life: game.life,
                life_max: game.life_max,
                act: game.act,
                act_max: game.act_max,
                atk: game.atk,
                atk_max: game.atk_max,
                def: game.def,
                def_max: game.def_max,
                rpe: game.rpe,
                exp: game.exp,
                exp_max: game.exp_max,
                lv: game.lv,
                gold: game.gold,
                key: game.key,
                key2: game.key2,
                combo: game.combo,
                addP: game.addP,
                neko: game.neko || [0,0,0,0,0,0,0,0]
            },
            // 保存地图状态
            mapState: this.getMapState(game)
        };
        
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
        console.log('游戏已保存', saveData);
        return true;
    },
    
    // 获取地图状态
    getMapState(game) {
        const state = {
            mapId: localStorage.getItem('selectedMap') || '1',
            missions: [],
            enemies: [],
            shops: []
        };
        
        // 保存任务状态
        if (game.missions) {
            game.missions.forEach((m, i) => {
                state.missions.push({
                    index: i,
                    life: m.life,
                    complete_flg: m.complete_flg,
                    lock_flg: m.lock_flg
                });
            });
        }
        
        // 保存敌人状态
        if (game.enemies) {
            game.enemies.forEach((e, i) => {
                state.enemies.push({
                    index: i,
                    life: e.life,
                    lock_flg: e.lock_flg,
                    _state: e._state
                });
            });
        }
        
        // 保存商店状态
        if (game.shops) {
            game.shops.forEach((s, i) => {
                state.shops.push({
                    index: i,
                    cnt: s.cnt,
                    lock_flg: s.lock_flg
                });
            });
        }
        
        return state;
    },
    
    // 加载存档
    load() {
        const saveStr = localStorage.getItem(this.SAVE_KEY);
        if (!saveStr) return null;
        
        try {
            const saveData = JSON.parse(saveStr);
            console.log('加载存档', saveData);
            return saveData;
        } catch (e) {
            console.error('存档解析失败', e);
            return null;
        }
    },
    
    // 应用玩家数据到游戏
    applyPlayerData(game, playerData) {
        if (!playerData) return;
        
        game.life = playerData.life;
        game.life_max = playerData.life_max;
        game.act = playerData.act;
        game.act_max = playerData.act_max;
        game.atk = playerData.atk;
        game.atk_max = playerData.atk_max;
        game.def = playerData.def;
        game.def_max = playerData.def_max;
        game.rpe = playerData.rpe;
        game.exp = playerData.exp;
        game.exp_max = playerData.exp_max;
        game.lv = playerData.lv;
        game.gold = playerData.gold;
        game.key = playerData.key;
        game.key2 = playerData.key2;
        game.combo = playerData.combo;
        game.addP = playerData.addP;
        game.neko = playerData.neko || [0,0,0,0,0,0,0,0];
    },
    
    // 应用地图状态
    applyMapState(game, mapState) {
        if (!mapState) return;
        
        // 检查存档的地图是否和当前地图匹配（通过数量判断）
        const currentMapId = localStorage.getItem('selectedMap') || '1';
        const savedMapId = mapState.mapId || '1';
        
        // 如果地图不匹配，不恢复地图状态（只恢复玩家数据）
        if (currentMapId !== savedMapId) {
            console.log('地图不匹配，跳过地图状态恢复');
            return;
        }
        
        // 恢复任务状态
        if (mapState.missions && game.missions) {
            mapState.missions.forEach(saved => {
                const m = game.missions[saved.index];
                if (m) {
                    m.life = saved.life;
                    m.complete_flg = saved.complete_flg;
                    m.lock_flg = saved.lock_flg;
                    if (m.complete_flg) {
                        m.progressFill.classList.add('complete');
                    }
                    if (m.lock_flg) {
                        m.element.classList.add('locked');
                    } else {
                        m.element.classList.remove('locked');
                    }
                    m.update();
                }
            });
        }
        
        // 恢复敌人状态
        if (mapState.enemies && game.enemies) {
            mapState.enemies.forEach(saved => {
                const e = game.enemies[saved.index];
                if (e) {
                    e.life = saved.life;
                    e.lock_flg = saved.lock_flg;
                    e._state = saved._state;
                    if (e.lock_flg) {
                        e.element.classList.add('locked');
                    } else {
                        e.element.classList.remove('locked');
                    }
                    if (e.life <= 0) {
                        e.progressBarBG.style.background = 'rgba(0, 255, 0, 0.3)';
                    }
                    e.update();
                }
            });
        }
        
        // 恢复商店状态
        if (mapState.shops && game.shops) {
            mapState.shops.forEach(saved => {
                const s = game.shops[saved.index];
                if (s) {
                    s.cnt = saved.cnt;
                    s.lock_flg = saved.lock_flg;
                    if (s.lock_flg) {
                        s.element.classList.add('locked');
                    } else {
                        s.element.classList.remove('locked');
                    }
                    s.update();
                }
            });
        }
    },
    
    // 检查是否有存档
    hasSave() {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    },
    
    // 删除存档（重新开始）
    deleteSave() {
        localStorage.removeItem(this.SAVE_KEY);
        console.log('存档已删除');
    },
    
    // 获取存档的地图ID
    getSavedMapId() {
        const saveData = this.load();
        return saveData ? saveData.selectedMap : null;
    }
};
