export interface BattleSimulateBody {
  attacker_id: string;
  defender_id: string;
}

export interface BattleReplayParams {
  id: string;
}

export interface BattleResult {
  ok: true;
  battle_id: string;
  winner: string;
  rounds: number;
}
