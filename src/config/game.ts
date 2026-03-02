export const GAME_CONFIG = {
  // 游戏设置
  PLAYER_COUNT: 3,
  CARDS_PER_PLAYER: 17,
  BOTTOM_CARDS_COUNT: 3,
  
  // AI 难度设置
  AI_DIFFICULTY: {
    EASY: 'easy',
    MEDIUM: 'medium', 
    HARD: 'hard'
  },
  
  // 游戏超时设置（毫秒）
  TURN_TIMEOUT: {
    BIDDING: 10000, // 叫地主10秒
    PLAYING: 15000  // 出牌15秒
  },
  
  // 分数倍数
  SCORE_MULTIPLIERS: {
    BASE: 1,
    ROCKET: 2,      // 火箭（双王）
    BOMB_4: 2,      // 四张炸弹
    BOMB_5: 4,      // 五张炸弹
    BOMB_6: 8,      // 六张炸弹
    SPRING: 2       // 春天/反春天
  }
}