import type { CSSProperties } from 'react';

export type StatAction = 'Kill'|'Attack error'|'Ace'|'Serve error'|'Dig'|'Block touch'|'Solo block'|'Assist'|'Pass 0'|'Pass 1'|'Pass 2'|'Pass 3';

type WheelPlayer = { number:string; name:string; position:string; libero:boolean };
type Props = {
  player: WheelPlayer;
  actions: StatAction[];
  position: { x:number; y:number };
  onSelect: (action:StatAction)=>void;
  onClose: ()=>void;
};

const actionMeta:Record<StatAction,{icon:string;tone:'positive'|'error'|'defense'|'setting'|'passing'}> = {
  'Kill': { icon:'K', tone:'positive' },
  'Attack error': { icon:'AE', tone:'error' },
  'Ace': { icon:'A', tone:'positive' },
  'Serve error': { icon:'SE', tone:'error' },
  'Dig': { icon:'D', tone:'defense' },
  'Block touch': { icon:'BT', tone:'defense' },
  'Solo block': { icon:'SB', tone:'defense' },
  'Assist': { icon:'AS', tone:'setting' },
  'Pass 0': { icon:'P0', tone:'passing' },
  'Pass 1': { icon:'P1', tone:'passing' },
  'Pass 2': { icon:'P2', tone:'passing' },
  'Pass 3': { icon:'P3', tone:'passing' }
};

export default function PlayerActionWheel({ player, actions, position, onSelect, onClose }:Props){
  const safeX=Math.max(21,Math.min(40,position.x));
  const safeY=Math.max(30,Math.min(70,position.y));
  return <div className="stat-wheel-backdrop" onPointerDown={onClose}>
    <div className="player-action-wheel" style={{left:`${safeX}%`,top:`${safeY}%`} as CSSProperties} onPointerDown={(event)=>event.stopPropagation()} role="dialog" aria-label={`Record a stat for ${player.name}`}>
      <div className="action-wheel-ring" aria-hidden="true" />
      {actions.map((action,index)=>{
        const angle=index*(360/actions.length);
        const meta=actionMeta[action];
        return <button className={`action-wheel-segment tone-${meta.tone}`} style={{'--segment-angle':`${angle}deg`,'--label-angle':'0deg',clipPath:'polygon(50% 0, 100% 24%, 86% 100%, 14% 100%, 0 24%)'} as CSSProperties} key={action} onClick={()=>onSelect(action)} type="button">
          <span style={{transform:`rotate(${-angle}deg)`}}><b>{meta.icon}</b><small>{action}</small></span>
        </button>;
      })}
      <div className={`action-wheel-player${player.libero?' is-libero':''}`}>
        <b>#{player.number}</b>
        <strong>{player.name.split(' ')[0]}</strong>
        <small>{player.position}</small>
      </div>
      <button className="action-wheel-close" onClick={onClose} type="button" aria-label="Close stat wheel">×</button>
    </div>
  </div>;
}
