'use client';
import {useState,type ReactNode} from 'react';
import styles from '../workspace.module.css';
export default function SettingsSections({initial,sections}:{initial:string;sections:{id:string;label:string;content:ReactNode}[]}){
 const [active,setActive]=useState(sections.some(section=>section.id===initial)?initial:sections[0].id);
 return <><nav className={styles.tabs} aria-label="Settings sections">{sections.map(section=><button key={section.id} type="button" className={styles.tab} aria-pressed={active===section.id} onClick={()=>{setActive(section.id);const url=new URL(window.location.href);url.searchParams.set('section',section.id);window.history.replaceState(null,'',url.pathname+url.search);}}>{section.label}</button>)}</nav>{sections.map(section=><section key={section.id} hidden={active!==section.id} aria-label={section.label} style={{display:active===section.id?'grid':'none',gap:20}}>{section.content}</section>)}</>;
}
