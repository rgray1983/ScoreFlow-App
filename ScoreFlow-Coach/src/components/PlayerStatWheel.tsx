import { useState } from 'react';

export type RecordedStat = 'Kill'|'Attack error'|'Ace'|'Serve error'|'Dig'|'Block touch'|'Solo block'|'Assist'|'Pass 0'|'Pass 1'|'Pass 2'|'Pass 3';

type PlayerStatWheelProps = {
  player: { number:string; name:string; position:string; libero:boolean };
  x:number;
  y:number;
  onSelect:(stat:RecordedStat)=>void;
  onClose:()=>void;
};

type WheelAction = { label:string; icon:string; tone:'positive'|'warning'|'defense'|'neutral'; stat?:RecordedStat; group?:'block'|'pass' };

const actions:WheelAction[] = [
  { label:'Kill', icon:'✦', tone:'positive', stat:'Kill' },
  { label:'Attack error', icon:'×', tone:'warning', stat:'Attack error' },
  { label:'Ace', icon:'⚡', tone:'positive', stat:'Ace' },
  { label:'Serve error', icon:'↘', tone:'warning', stat:'Serve error' },
  { label:'Dig', icon:'◇', tone:'defense', stat:'Dig' },
  { label:'Block', icon:'▣', tone:'defense', group:'block' },
  { label:'Assist', icon:'↗', tone:'positive', stat:'Assist' },
  { label:'Pass', icon:'③', tone:'neutral', group:'pass' }
];

const groupOptions = {
  block:[{ label:'Touch', stat:'Block touch' as RecordedStat },{ label:'Solo', stat:'Solo block' as RecordedStat }],
  pass:[0,1,2,3].map((rating)=>({ label:`Pass ${rating}`, stat:`Pass ${rating}` as RecordedStat }))
};

export default function PlayerStatWheel({ player, x, y, onSelect, onClose }:PlayerStatWheelProps){
  const [group,setGroup]=useState<'block'|'pass'|null>(null);
  const wheelX=Math.max(20,Math.min(45,x));
  const wheelY=Math.max(25,Math.min(75,y));

  return <div className="stat-wheel-backdrop" onPointerDown={onClose}>
    <div className={`player-stat-wheel${group?' is-group-open':''}`} style={{left:`${wheelX}%`,top:`${wheelY}%`}} onPointerDown={(event)=>event.stopPropagation()} role="dialog" aria-label={`Record a stat for ${player.name}`}>
      <div className={`stat-wheel-ring${group?' is-muted':''}`}>
        {actions.map((action,index)=><button className={`stat-wedge tone-${action.tone}`} style={{'--wheel-index':index} as React.CSSProperties} key={action.label} onClick={()=>action.group?setGroup(action.group):action.stat&&onSelect(action.stat)} type="button">
          <span className="stat-wedge-icon" aria-hidden="true">{action.icon}</span><span>{action.label}</span>
        </button>)}
      </div>

      <button className={`stat-wheel-hub${player.libero?' is-libero':''}`} onClick={onClose} type="button" aria-label="Close stat wheel">
        <b>#{player.number}</b><strong>{player.name.split(' ')[0]}</strong><small>{player.position}</small>
      </button>

      {group&&<div className="stat-subwheel">
        <span>{group==='block'?'Block result':'Pass rating'}</span>
        <div>{groupOptions[group].map((option)=><button key={option.stat} onClick={()=>onSelect(option.stat)} type="button">{option.label}</button>)}</div>
        <button className="stat-subwheel-back" onClick={()=>setGroup(null)} type="button">Back</button>
      </div>}
    </div>
  </div>;
}
