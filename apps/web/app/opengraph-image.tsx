import {ImageResponse} from 'next/og';
export const alt='Stemory Blooms — Handcrafted everlasting arrangements, made in Morocco';
export const size={width:1200,height:630};
export const contentType='image/png';
export default function OpenGraphImage(){return new ImageResponse(<div style={{width:'100%',height:'100%',background:'#f5f1e9',color:'#3e5539',display:'flex',flexDirection:'column',justifyContent:'center',padding:80,border:'20px solid #3e5539'}}><div style={{fontSize:24,letterSpacing:6,marginBottom:35}}>MADE BY HAND IN MOROCCO</div><div style={{fontSize:85,lineHeight:1.1}}>Stemory Blooms</div><div style={{fontSize:35,marginTop:30}}>Everlasting arrangements. Thoughtful gifts.</div></div>,size);}
